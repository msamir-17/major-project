from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from core.security import get_current_user
from database import get_db
from models import Comment, CommunityPost, PostLike, UserProfile

router = APIRouter()


def _ensure_learner(current_user: UserProfile):
    if current_user.is_mentor:
        raise HTTPException(status_code=403, detail="Only learners can access the community.")


class CreatePostRequest(BaseModel):
    title: str
    content: str
    tags: Optional[str] = ""


class CreateCommentRequest(BaseModel):
    content: str


class LikeResponse(BaseModel):
    likes_count: int
    liked: bool


@router.post("/community/posts", response_model=dict)
def create_post(
    request: CreatePostRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_learner(current_user)

    title = (request.title or "").strip()
    content = (request.content or "").strip()
    tags = (request.tags or "").strip()

    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
    if not content:
        raise HTTPException(status_code=400, detail="Content is required")

    post = CommunityPost(
        title=title,
        content=content,
        tags=tags,
        author_id=current_user.id,
        likes_count=0,
        created_at=datetime.utcnow(),
    )

    db.add(post)
    db.commit()
    db.refresh(post)

    return {
        **post.model_dump(),
        "author": {"id": current_user.id, "full_name": current_user.full_name},
    }


@router.get("/community/posts", response_model=List[dict])
def list_posts(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_learner(current_user)

    posts = db.exec(select(CommunityPost).order_by(CommunityPost.created_at.desc())).all()
    if not posts:
        return []

    author_ids = list({p.author_id for p in posts})
    authors = db.exec(select(UserProfile).where(UserProfile.id.in_(author_ids))).all()
    author_map = {a.id: a for a in authors}

    result: List[dict] = []
    for p in posts:
        a = author_map.get(p.author_id)
        result.append(
            {
                **p.model_dump(),
                "author": {"id": p.author_id, "full_name": a.full_name if a else f"User #{p.author_id}"},
            }
        )

    return result


@router.get("/community/posts/{post_id}", response_model=dict)
def get_post_details(
    post_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_learner(current_user)

    post = db.get(CommunityPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    author = db.get(UserProfile, post.author_id)

    comments = db.exec(
        select(Comment).where(Comment.post_id == post_id).order_by(Comment.created_at.asc())
    ).all()

    comment_user_ids = list({c.user_id for c in comments})
    users = []
    if comment_user_ids:
        users = db.exec(select(UserProfile).where(UserProfile.id.in_(comment_user_ids))).all()
    user_map = {u.id: u for u in users}

    comments_payload: List[dict] = []
    for c in comments:
        u = user_map.get(c.user_id)
        comments_payload.append(
            {
                **c.model_dump(),
                "user": {"id": c.user_id, "full_name": u.full_name if u else f"User #{c.user_id}"},
            }
        )

    liked = (
        db.exec(
            select(PostLike).where(
                (PostLike.post_id == post_id) & (PostLike.user_id == current_user.id)
            )
        ).first()
        is not None
    )

    return {
        **post.model_dump(),
        "author": {
            "id": post.author_id,
            "full_name": author.full_name if author else f"User #{post.author_id}",
        },
        "comments": comments_payload,
        "liked": liked,
    }


@router.post("/community/posts/{post_id}/comments", response_model=dict)
def add_comment(
    post_id: int,
    request: CreateCommentRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_learner(current_user)

    post = db.get(CommunityPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    content = (request.content or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment content is required")

    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=content,
        created_at=datetime.utcnow(),
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {
        **comment.model_dump(),
        "user": {"id": current_user.id, "full_name": current_user.full_name},
    }


@router.post("/community/posts/{post_id}/like", response_model=LikeResponse)
def like_post(
    post_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ensure_learner(current_user)

    post = db.get(CommunityPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = db.exec(
        select(PostLike).where((PostLike.post_id == post_id) & (PostLike.user_id == current_user.id))
    ).first()

    if existing:
        return LikeResponse(likes_count=post.likes_count, liked=True)

    like = PostLike(post_id=post_id, user_id=current_user.id, created_at=datetime.utcnow())
    db.add(like)

    post.likes_count = int(post.likes_count or 0) + 1
    db.add(post)

    db.commit()
    db.refresh(post)

    return LikeResponse(likes_count=post.likes_count, liked=True)
