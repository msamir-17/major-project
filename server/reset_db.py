"""
Database reset utility for development
Drops all tables and recreates them based on current models
"""
import os
import logging
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, text
from models import UserProfile, MentorProfile

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_database():
    """Drop and recreate all database tables with CASCADE"""
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        logger.error("❌ DATABASE_URL environment variable is required")
        logger.info("💡 Create a .env file with: DATABASE_URL=postgresql://username:password@localhost:5432/skillbridge")
        raise ValueError("DATABASE_URL environment variable is required")
    
    engine = create_engine(DATABASE_URL, echo=False)
    
    try:
        with engine.connect() as connection:
            # Get all existing tables to drop them with CASCADE
            logger.info("🔍 Finding existing tables...")
            
            # Get all table names in the public schema
            result = connection.execute(text("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
            """))
            
            existing_tables = [row[0] for row in result.fetchall()]
            
            if existing_tables:
                logger.info(f"🗑️ Found tables to drop: {', '.join(existing_tables)}")
                
                # Drop each table with CASCADE to handle dependencies
                for table_name in existing_tables:
                    try:
                        logger.info(f"   Dropping table: {table_name}")
                        connection.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
                    except Exception as e:
                        logger.warning(f"   Warning dropping {table_name}: {str(e)}")
                
                # Commit the drops
                connection.commit()
                logger.info("✅ All existing tables dropped successfully")
            else:
                logger.info("ℹ️ No existing tables found")
        
        # Create all tables with current schema
        logger.info("🏗️ Creating tables with current schema...")
        SQLModel.metadata.create_all(engine)
        
        logger.info("✅ Database reset completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Database reset failed: {str(e)}")
        raise

def main():
    """Main function with error handling"""
    try:
        reset_database()
        print("\n" + "="*50)
        print("🎯 DATABASE RESET SUCCESSFUL")
        print("="*50)
        print("✅ All tables dropped and recreated")
        print("💡 Ready to run: python seed.py")
        print("="*50)
    except ValueError as e:
        print(f"\n❌ Configuration Error: {e}")
    except Exception as e:
        print(f"\n❌ Reset Error: {e}")
        print("\n💡 Try running these SQL commands manually:")
        print("   DROP SCHEMA public CASCADE;")
        print("   CREATE SCHEMA public;")

if __name__ == "__main__":
    main()