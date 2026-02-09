from fastapi import APIRouter, WebSocket, Depends, WebSocketDisconnect
from sqlmodel import Session, select
from typing import List

from database import get_db
from models import UserProfile, Message
from core.security import get_current_user

router = APIRouter()

# -------------------- Connection Manager --------------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)


manager = ConnectionManager()

# -------------------- WebSocket Endpoint --------------------

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
        # We import the tool for decoding the token
        from core.security import verify_token
        
        # We need a database session to find the user
        from database import engine
        from sqlmodel import Session
        
        payload = verify_token(token)
        if not payload or "user_id" not in payload:
            await websocket.close(code=4001) # Use a custom code for clarity
            return

        user_id = payload.get("user_id")

        # Make sure the user actually exists in the database
        with Session(engine) as session:
            user = session.get(UserProfile, user_id)
            if not user:
                await websocket.close(code=4001)
                return

        # If everything is okay, connect them to the switchboard
        await manager.connect(user_id, websocket)
        try:
            while True:
                data = await websocket.receive_json()

                # --- JOB 1: Save message in database ---
                with Session(engine) as session:
                    db_message = Message(
                        sender_id=user_id,
                        recipient_id=data['recipient_id'],
                        content=data['content']
                    )
                    session.add(db_message)
                    session.commit()
                    session.refresh(db_message) # Get the full message object back
                
                # --- JOB 2: Deliver the message to the recipient (if online) ---
                # We need to send the full message object so the frontend knows who sent it
                await manager.send_personal_message(
                    db_message.json(), # Send the whole message as a JSON string
                    data['recipient_id']
                )

        except WebSocketDisconnect:
            manager.disconnect(user_id)
        except Exception as e:
            print(f"Error in websocket for user {user_id}: {e}")
            manager.disconnect(user_id)
# -------------------- Message History API --------------------

@router.get("/messages/{recipient_id}", response_model=List[Message])
def get_message_history(
    recipient_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # (me → them) OR (them → me)
    statement = select(Message).where(
        ((Message.sender_id == current_user.id) & (Message.recipient_id == recipient_id)) |
        ((Message.sender_id == recipient_id) & (Message.recipient_id == current_user.id))
    ).order_by(Message.timestamp)

    messages = db.exec(statement).all()
    return messages
