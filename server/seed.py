"""
Database seeding script for SkillBridge platform

This module seeds the database with realistic user profiles, mentor data,
and skills information for testing the recommendation system.
"""
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlmodel import SQLModel, Session, create_engine, select
from models import UserProfile
from passlib.context import CryptContext
import logging
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required for PostgreSQL connection")

engine = create_engine(DATABASE_URL, echo=True)  # Enable echo for debugging

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


class DataSeeder:
    """Main data seeding class for SkillBridge platform"""
    
    def __init__(self):
        self.skills_data = self._load_skills_data()
        self.users_data = self._load_users_data()
        self.mentors_data = self._load_mentors_data()
        
    def _load_skills_data(self) -> List[Dict]:
        """Load comprehensive skills data organized by categories"""
        return [
            # Programming Languages
            {"name": "Python", "category": "Programming", "level": "intermediate", "demand": 9},
            {"name": "JavaScript", "category": "Programming", "level": "intermediate", "demand": 10},
            {"name": "Java", "category": "Programming", "level": "intermediate", "demand": 8},
            {"name": "TypeScript", "category": "Programming", "level": "advanced", "demand": 9},
            {"name": "Go", "category": "Programming", "level": "advanced", "demand": 7},
            {"name": "Rust", "category": "Programming", "level": "advanced", "demand": 6},
            {"name": "C++", "category": "Programming", "level": "advanced", "demand": 7},
            {"name": "C#", "category": "Programming", "level": "intermediate", "demand": 8},
            {"name": "PHP", "category": "Programming", "level": "intermediate", "demand": 6},
            {"name": "Ruby", "category": "Programming", "level": "intermediate", "demand": 5},
            
            # Web Development
            {"name": "React", "category": "Frontend", "level": "intermediate", "demand": 10},
            {"name": "Vue.js", "category": "Frontend", "level": "intermediate", "demand": 8},
            {"name": "Angular", "category": "Frontend", "level": "advanced", "demand": 7},
            {"name": "Node.js", "category": "Backend", "level": "intermediate", "demand": 9},
            {"name": "Express.js", "category": "Backend", "level": "intermediate", "demand": 8},
            {"name": "Django", "category": "Backend", "level": "intermediate", "demand": 7},
            {"name": "Flask", "category": "Backend", "level": "beginner", "demand": 6},
            {"name": "FastAPI", "category": "Backend", "level": "intermediate", "demand": 8},
            {"name": "Next.js", "category": "Frontend", "level": "advanced", "demand": 9},
            {"name": "Svelte", "category": "Frontend", "level": "intermediate", "demand": 6},
            
            # Data Science & AI
            {"name": "Machine Learning", "category": "AI/ML", "level": "advanced", "demand": 10},
            {"name": "Deep Learning", "category": "AI/ML", "level": "advanced", "demand": 9},
            {"name": "Natural Language Processing", "category": "AI/ML", "level": "advanced", "demand": 8},
            {"name": "Computer Vision", "category": "AI/ML", "level": "advanced", "demand": 8},
            {"name": "Data Analysis", "category": "Data Science", "level": "intermediate", "demand": 9},
            {"name": "Data Visualization", "category": "Data Science", "level": "intermediate", "demand": 8},
            {"name": "Statistical Analysis", "category": "Data Science", "level": "intermediate", "demand": 7},
            {"name": "TensorFlow", "category": "AI/ML", "level": "advanced", "demand": 8},
            {"name": "PyTorch", "category": "AI/ML", "level": "advanced", "demand": 9},
            {"name": "Pandas", "category": "Data Science", "level": "intermediate", "demand": 8},
            {"name": "NumPy", "category": "Data Science", "level": "intermediate", "demand": 7},
            {"name": "Scikit-learn", "category": "AI/ML", "level": "intermediate", "demand": 8},
            
            # Cloud & DevOps
            {"name": "AWS", "category": "Cloud", "level": "intermediate", "demand": 10},
            {"name": "Azure", "category": "Cloud", "level": "intermediate", "demand": 8},
            {"name": "Google Cloud", "category": "Cloud", "level": "intermediate", "demand": 8},
            {"name": "Docker", "category": "DevOps", "level": "intermediate", "demand": 9},
            {"name": "Kubernetes", "category": "DevOps", "level": "advanced", "demand": 9},
            {"name": "CI/CD", "category": "DevOps", "level": "intermediate", "demand": 8},
            {"name": "Jenkins", "category": "DevOps", "level": "intermediate", "demand": 6},
            {"name": "Terraform", "category": "DevOps", "level": "advanced", "demand": 7},
            {"name": "Ansible", "category": "DevOps", "level": "intermediate", "demand": 6},
            
            # Databases
            {"name": "PostgreSQL", "category": "Database", "level": "intermediate", "demand": 8},
            {"name": "MongoDB", "category": "Database", "level": "intermediate", "demand": 7},
            {"name": "MySQL", "category": "Database", "level": "intermediate", "demand": 7},
            {"name": "Redis", "category": "Database", "level": "intermediate", "demand": 7},
            {"name": "Elasticsearch", "category": "Database", "level": "advanced", "demand": 6},
            
            # Mobile Development
            {"name": "React Native", "category": "Mobile", "level": "intermediate", "demand": 8},
            {"name": "Flutter", "category": "Mobile", "level": "intermediate", "demand": 8},
            {"name": "iOS Development", "category": "Mobile", "level": "advanced", "demand": 7},
            {"name": "Android Development", "category": "Mobile", "level": "advanced", "demand": 7},
            {"name": "Swift", "category": "Mobile", "level": "advanced", "demand": 6},
            {"name": "Kotlin", "category": "Mobile", "level": "intermediate", "demand": 7},
            
            # Soft Skills
            {"name": "Leadership", "category": "Soft Skills", "level": "intermediate", "demand": 9},
            {"name": "Project Management", "category": "Soft Skills", "level": "intermediate", "demand": 8},
            {"name": "Communication", "category": "Soft Skills", "level": "intermediate", "demand": 10},
            {"name": "Team Collaboration", "category": "Soft Skills", "level": "intermediate", "demand": 9},
            {"name": "Problem Solving", "category": "Soft Skills", "level": "intermediate", "demand": 10},
            {"name": "Agile/Scrum", "category": "Methodology", "level": "intermediate", "demand": 8},
        ]
        
    def _load_users_data(self) -> List[Dict]:
        """Generate diverse learner profiles for recommendation testing"""
        user_profiles = [
            {
                "full_name": "Alice Johnson",
                "email": "alice.johnson@email.com",
                "password": "password123",
                "phone_number": "+1-555-0101",
                "bio": "Software engineer passionate about web development and AI. Looking to transition into machine learning roles.",
                "location": "San Francisco, CA",
                "learning_goal": "Transition to ML Engineering role",
                "preferred_language": "English",
                "time_zone": "PST",
                "learning_style": "hands-on",
                "experience_level": "intermediate",
                "availability": "evenings,weekends",
                "skills_interested": "Machine Learning,Deep Learning,TensorFlow,Data Analysis",
                "current_skills": "Python,JavaScript,React,Node.js"
            },
            {
                "full_name": "Bob Smith",
                "email": "bob.smith@email.com",
                "password": "password123",
                "phone_number": "+1-555-0102",
                "bio": "Recent CS graduate eager to start career in full-stack development.",
                "location": "New York, NY",
                "learning_goal": "Become Senior Full-Stack Developer",
                "preferred_language": "English",
                "time_zone": "EST",
                "learning_style": "visual",
                "experience_level": "beginner",
                "availability": "flexible",
                "skills_interested": "React,Node.js,PostgreSQL,AWS",
                "current_skills": "Python,JavaScript,HTML/CSS,Git"
            },
            {
                "full_name": "Carol Davis",
                "email": "carol.davis@email.com",
                "password": "password123",
                "phone_number": "+1-555-0103",
                "bio": "Data analyst wanting to advance to senior roles. 5 years experience in analytics.",
                "location": "Austin, TX",
                "learning_goal": "Master advanced data science techniques",
                "preferred_language": "English",
                "time_zone": "CST",
                "learning_style": "project-based",
                "experience_level": "intermediate",
                "availability": "weekends",
                "skills_interested": "Deep Learning,PyTorch,Computer Vision,Statistical Analysis",
                "current_skills": "Python,Pandas,SQL,Data Visualization"
            }
        ]
        
        # Generate additional random learners
        locations = ["San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", 
                    "Denver, CO", "Chicago, IL", "Boston, MA", "Los Angeles, CA", 
                    "Miami, FL", "Portland, OR"]
        experience_levels = ["beginner", "intermediate", "advanced"]
        learning_styles = ["visual", "hands-on", "theoretical", "project-based"]
        time_zones = ["PST", "EST", "CST", "MST"]
        
        for i in range(4, 21):  # Generate users 4-20
            skills_list = [skill["name"] for skill in self.skills_data]
            current_skills = random.sample(skills_list, k=random.randint(2, 6))
            skills_interested = random.sample(
                [s for s in skills_list if s not in current_skills], 
                k=random.randint(3, 8)
            )
            
            user_profiles.append({
                "full_name": f"User {i}",
                "email": f"user{i}@email.com",
                "password": "password123",
                "phone_number": f"+1-555-01{i:02d}",
                "bio": f"Tech professional #{i} on learning journey to advance career skills.",
                "location": random.choice(locations),
                "learning_goal": random.choice(self._get_random_career_goals()),
                "preferred_language": "English",
                "time_zone": random.choice(time_zones),
                "learning_style": random.choice(learning_styles),
                "experience_level": random.choice(experience_levels),
                "availability": random.choice(["flexible", "evenings", "weekends", "evenings,weekends"]),
                "skills_interested": ",".join(skills_interested),
                "current_skills": ",".join(current_skills)
            })
        
        return user_profiles
    
    # ...existing code...

    def _load_mentors_data(self) -> List[Dict]:
        """Generate comprehensive mentor profiles with expertise for better recommendations"""
        return [
            # AI/ML Mentors
            {
                "full_name": "Sarah Martinez",
                "email": "sarah.martinez@email.com",
                "password": "password123",
                "phone_number": "+1-555-0201",
                "bio": "Senior ML Engineer at Google with 8+ years experience. Passionate about mentoring the next generation of AI engineers. Specialized in computer vision and NLP applications.",
                "location": "Mountain View, CA",
                "skills": "Python,Machine Learning,Deep Learning,TensorFlow,PyTorch,Computer Vision,NLP,Statistical Analysis",
                "expertise": "AI/ML Engineering,Computer Vision,Natural Language Processing,Deep Learning Architecture",
                "experience_years": 8,
                "languages_spoken": "English,Spanish",
                "availability": "evenings,weekends",
                "hourly_rate": 150.0,
                "linkedin_url": "https://linkedin.com/in/sarah-martinez-ml",
                "company": "Google",
                "job_title": "Senior ML Engineer"
            },
            {
                "full_name": "Dr. Raj Patel",
                "email": "raj.patel@email.com",
                "password": "password123",
                "phone_number": "+1-555-0209",
                "bio": "AI Research Scientist with PhD in Machine Learning. 12+ years in academia and industry. Expert in deep learning, reinforcement learning, and AI ethics.",
                "location": "Stanford, CA",
                "skills": "Python,Deep Learning,Reinforcement Learning,PyTorch,TensorFlow,Research Methods,AI Ethics,Mathematics",
                "expertise": "Deep Learning Research,Reinforcement Learning,AI Ethics,Academic Research,Neural Networks",
                "experience_years": 12,
                "languages_spoken": "English,Hindi,Gujarati",
                "availability": "weekends",
                "hourly_rate": 200.0,
                "linkedin_url": "https://linkedin.com/in/dr-raj-patel-ai",
                "company": "Stanford AI Lab",
                "job_title": "Senior Research Scientist"
            },
            
            # Full-Stack Development Mentors
            {
                "full_name": "Mike Chen",
                "email": "mike.chen@email.com",
                "password": "password123",
                "phone_number": "+1-555-0202",
                "bio": "Full-stack developer and team lead at Netflix with 10+ years building scalable web applications. Expert in React ecosystem and Node.js microservices.",
                "location": "Los Angeles, CA",
                "skills": "React,Node.js,JavaScript,TypeScript,AWS,MongoDB,System Design,Leadership,Express.js,Next.js",
                "expertise": "Full-Stack Development,System Architecture,Team Leadership,Microservices,Scalable Web Apps",
                "experience_years": 10,
                "languages_spoken": "English,Mandarin",
                "availability": "flexible",
                "hourly_rate": 120.0,
                "linkedin_url": "https://linkedin.com/in/mike-chen-dev",
                "company": "Netflix",
                "job_title": "Senior Software Engineer"
            },
            {
                "full_name": "Elena Rodriguez",
                "email": "elena.rodriguez@email.com",
                "password": "password123",
                "phone_number": "+1-555-0210",
                "bio": "Full-stack architect with expertise in modern JavaScript frameworks. 9+ years building enterprise applications. Passionate about clean code and mentoring junior developers.",
                "location": "Austin, TX",
                "skills": "Vue.js,React,Node.js,TypeScript,GraphQL,PostgreSQL,AWS,Docker,Webpack,Jest",
                "expertise": "Frontend Architecture,Modern JavaScript,Vue.js Ecosystem,GraphQL,Enterprise Applications",
                "experience_years": 9,
                "languages_spoken": "English,Spanish",
                "availability": "evenings",
                "hourly_rate": 130.0,
                "linkedin_url": "https://linkedin.com/in/elena-rodriguez-fullstack",
                "company": "Shopify",
                "job_title": "Senior Full-Stack Developer"
            },
            
            # Data Science Mentors
            {
                "full_name": "Jennifer Kim",
                "email": "jennifer.kim@email.com",
                "password": "password123",
                "phone_number": "+1-555-0203",
                "bio": "Principal Data Scientist specializing in healthcare analytics with 12+ years experience in statistical modeling and machine learning research.",
                "location": "Boston, MA",
                "skills": "Python,R,SQL,Tableau,Statistics,Machine Learning,Healthcare Analytics,Research Methods,Pandas,NumPy",
                "expertise": "Data Science,Statistical Analysis,Healthcare Analytics,Research Methodology,Predictive Modeling",
                "experience_years": 12,
                "languages_spoken": "English,Korean",
                "availability": "weekends",
                "hourly_rate": 180.0,
                "linkedin_url": "https://linkedin.com/in/jennifer-kim-data",
                "company": "MIT Medical Center",
                "job_title": "Principal Data Scientist"
            },
            {
                "full_name": "Marcus Johnson",
                "email": "marcus.johnson@email.com",
                "password": "password123",
                "phone_number": "+1-555-0211",
                "bio": "Senior Data Analyst turned Data Scientist. 7+ years in business intelligence and predictive analytics. Expert in turning data into actionable business insights.",
                "location": "Chicago, IL",
                "skills": "Python,SQL,Tableau,Power BI,Excel,Statistics,Pandas,Scikit-learn,Data Visualization,Business Intelligence",
                "expertise": "Business Intelligence,Data Analytics,Predictive Modeling,Data Visualization,Statistical Analysis",
                "experience_years": 7,
                "languages_spoken": "English",
                "availability": "evenings,weekends",
                "hourly_rate": 110.0,
                "linkedin_url": "https://linkedin.com/in/marcus-johnson-data",
                "company": "Deloitte",
                "job_title": "Senior Data Scientist"
            },
            
            # Mobile Development Mentors
            {
                "full_name": "Alex Thompson",
                "email": "alex.thompson@email.com",
                "password": "password123",
                "phone_number": "+1-555-0204",
                "bio": "Mobile development expert with apps reaching millions of users. Former startup CTO with extensive product development and team leadership experience.",
                "location": "Austin, TX",
                "skills": "Swift,Kotlin,React Native,Flutter,iOS Development,Android Development,Mobile Architecture,Product Strategy,Leadership",
                "expertise": "Mobile Development,Cross-Platform Apps,Product Development,Startup Leadership,Mobile Architecture",
                "experience_years": 9,
                "languages_spoken": "English",
                "availability": "evenings",
                "hourly_rate": 140.0,
                "linkedin_url": "https://linkedin.com/in/alex-thompson-mobile",
                "company": "Uber",
                "job_title": "Staff Mobile Engineer"
            },
            {
                "full_name": "Priya Sharma",
                "email": "priya.sharma@email.com",
                "password": "password123",
                "phone_number": "+1-555-0212",
                "bio": "Flutter specialist and mobile UI/UX expert. 6+ years creating beautiful cross-platform applications. Google Developer Expert for Flutter and Firebase.",
                "location": "San Francisco, CA",
                "skills": "Flutter,Dart,Firebase,React Native,UI/UX Design,Mobile Architecture,Android Development,iOS Development",
                "expertise": "Flutter Development,Cross-Platform Mobile,Mobile UI/UX,Firebase,Google Technologies",
                "experience_years": 6,
                "languages_spoken": "English,Hindi,Punjabi",
                "availability": "flexible",
                "hourly_rate": 125.0,
                "linkedin_url": "https://linkedin.com/in/priya-sharma-flutter",
                "company": "Google",
                "job_title": "Senior Mobile Developer"
            },
            
            # DevOps/Cloud Mentors
            {
                "full_name": "Lisa Rodriguez",
                "email": "lisa.rodriguez@email.com",
                "password": "password123",
                "phone_number": "+1-555-0205",
                "bio": "DevOps architect specializing in cloud infrastructure and CI/CD pipelines at scale. Expert in AWS, Kubernetes, and Infrastructure as Code practices.",
                "location": "Seattle, WA",
                "skills": "AWS,Azure,Kubernetes,Docker,Terraform,CI/CD,Infrastructure as Code,Jenkins,Python,Ansible",
                "expertise": "DevOps Practices,Cloud Architecture,Infrastructure Design,Automation,Container Orchestration",
                "experience_years": 11,
                "languages_spoken": "English,Spanish",
                "availability": "weekends",
                "hourly_rate": 160.0,
                "linkedin_url": "https://linkedin.com/in/lisa-rodriguez-devops",
                "company": "Amazon Web Services",
                "job_title": "Principal DevOps Engineer"
            },
            {
                "full_name": "Ahmed Hassan",
                "email": "ahmed.hassan@email.com",
                "password": "password123",
                "phone_number": "+1-555-0213",
                "bio": "Cloud Solutions Architect with expertise in multi-cloud deployments. 8+ years helping enterprises migrate to cloud. AWS and Azure certified professional.",
                "location": "New York, NY",
                "skills": "AWS,Azure,Google Cloud,Kubernetes,Docker,Terraform,CloudFormation,Microservices,Security",
                "expertise": "Multi-Cloud Architecture,Cloud Migration,Enterprise Solutions,Cloud Security,Scalable Infrastructure",
                "experience_years": 8,
                "languages_spoken": "English,Arabic",
                "availability": "evenings",
                "hourly_rate": 155.0,
                "linkedin_url": "https://linkedin.com/in/ahmed-hassan-cloud",
                "company": "Microsoft Azure",
                "job_title": "Principal Cloud Architect"
            },
            
            # Backend Development Mentors
            {
                "full_name": "James Wilson",
                "email": "james.wilson@email.com",
                "password": "password123",
                "phone_number": "+1-555-0206",
                "bio": "Backend architect with 15+ years experience building high-performance distributed systems. Expert in Java, microservices, and database optimization.",
                "location": "Chicago, IL",
                "skills": "Java,Spring Boot,Microservices,PostgreSQL,Redis,System Design,API Design,Performance Optimization",
                "expertise": "Backend Architecture,Distributed Systems,Database Design,Performance Tuning,Scalability",
                "experience_years": 15,
                "languages_spoken": "English",
                "availability": "evenings",
                "hourly_rate": 135.0,
                "linkedin_url": "https://linkedin.com/in/james-wilson-backend",
                "company": "Microsoft",
                "job_title": "Principal Software Architect"
            },
            {
                "full_name": "Sofia Petrov",
                "email": "sofia.petrov@email.com",
                "password": "password123",
                "phone_number": "+1-555-0214",
                "bio": "Python backend specialist with expertise in FastAPI and Django. 7+ years building scalable APIs and microservices. Strong background in database design and optimization.",
                "location": "Denver, CO",
                "skills": "Python,FastAPI,Django,PostgreSQL,MongoDB,Redis,Docker,API Design,Microservices,Performance Optimization",
                "expertise": "Python Backend Development,API Architecture,Database Optimization,Microservices Design",
                "experience_years": 7,
                "languages_spoken": "English,Russian,Bulgarian",
                "availability": "flexible",
                "hourly_rate": 115.0,
                "linkedin_url": "https://linkedin.com/in/sofia-petrov-python",
                "company": "Stripe",
                "job_title": "Senior Backend Engineer"
            },
            
            # Frontend Development Mentors
            {
                "full_name": "Maria Garcia",
                "email": "maria.garcia@email.com",
                "password": "password123",
                "phone_number": "+1-555-0207",
                "bio": "Frontend architect and UX engineer with 9+ years creating beautiful, accessible web applications. Specializes in React, Vue.js, and modern CSS.",
                "location": "Miami, FL",
                "skills": "React,Vue.js,TypeScript,CSS,SCSS,Webpack,Figma,Accessibility,Performance Optimization",
                "expertise": "Frontend Architecture,UI/UX Design,Web Performance,Accessibility,Modern JavaScript",
                "experience_years": 9,
                "languages_spoken": "English,Spanish,Portuguese",
                "availability": "flexible",
                "hourly_rate": 125.0,
                "linkedin_url": "https://linkedin.com/in/maria-garcia-frontend",
                "company": "Airbnb",
                "job_title": "Senior Frontend Engineer"
            },
            {
                "full_name": "David Kim",
                "email": "david.kim@email.com",
                "password": "password123",
                "phone_number": "+1-555-0215",
                "bio": "Angular specialist and TypeScript expert. 8+ years building enterprise-grade frontend applications. Strong focus on performance, testing, and maintainable code.",
                "location": "Portland, OR",
                "skills": "Angular,TypeScript,JavaScript,RxJS,NgRx,Jest,Cypress,SCSS,Webpack,Performance Optimization",
                "expertise": "Angular Development,TypeScript,Enterprise Frontend,Testing Strategies,Performance Optimization",
                "experience_years": 8,
                "languages_spoken": "English,Korean",
                "availability": "evenings,weekends",
                "hourly_rate": 120.0,
                "linkedin_url": "https://linkedin.com/in/david-kim-angular",
                "company": "Intel",
                "job_title": "Senior Frontend Developer"
            },
            
            # Cybersecurity Mentor
            {
                "full_name": "Robert Taylor",
                "email": "robert.taylor@email.com",
                "password": "password123",
                "phone_number": "+1-555-0208",
                "bio": "Cybersecurity expert with 13+ years protecting enterprise systems. CISSP certified with experience in penetration testing and security architecture.",
                "location": "Washington, DC",
                "skills": "Cybersecurity,Penetration Testing,Network Security,Python,Linux,Risk Assessment,Compliance",
                "expertise": "Information Security,Ethical Hacking,Security Architecture,Compliance,Risk Management",
                "experience_years": 13,
                "languages_spoken": "English",
                "availability": "weekends",
                "hourly_rate": 175.0,
                "linkedin_url": "https://linkedin.com/in/robert-taylor-security",
                "company": "Lockheed Martin",
                "job_title": "Principal Security Architect"
            },
            
            # Junior-Friendly Mentors for Beginners
            {
                "full_name": "Jessica Wong",
                "email": "jessica.wong@email.com",
                "password": "password123",
                "phone_number": "+1-555-0216",
                "bio": "Junior-friendly mentor specializing in helping bootcamp graduates and career changers. 5+ years in web development with focus on practical, hands-on learning.",
                "location": "San Diego, CA",
                "skills": "JavaScript,React,Node.js,HTML/CSS,Git,MongoDB,Express.js,Problem Solving,Communication",
                "expertise": "Beginner Programming,Career Transition,Web Development Basics,Bootcamp Support,Soft Skills",
                "experience_years": 5,
                "languages_spoken": "English,Cantonese",
                "availability": "flexible",
                "hourly_rate": 85.0,
                "linkedin_url": "https://linkedin.com/in/jessica-wong-mentor",
                "company": "Freelance",
                "job_title": "Full-Stack Developer & Mentor"
            },
            
            # Product Management & Leadership
            {
                "full_name": "Michael Thompson",
                "email": "michael.thompson@email.com",
                "password": "password123",
                "phone_number": "+1-555-0217",
                "bio": "Technical Product Manager with engineering background. 10+ years leading cross-functional teams and building successful products. Expert in agile methodologies and stakeholder management.",
                "location": "San Francisco, CA",
                "skills": "Product Management,Leadership,Agile/Scrum,Project Management,Communication,Team Collaboration,Strategy",
                "expertise": "Technical Product Management,Team Leadership,Agile Methodologies,Product Strategy,Stakeholder Management",
                "experience_years": 10,
                "languages_spoken": "English",
                "availability": "evenings",
                "hourly_rate": 145.0,
                "linkedin_url": "https://linkedin.com/in/michael-thompson-pm",
                "company": "Meta",
                "job_title": "Senior Product Manager"
            },
            
            # Game Development Mentor
            {
                "full_name": "Ryan O'Connor",
                "email": "ryan.oconnor@email.com",
                "password": "password123",
                "phone_number": "+1-555-0218",
                "bio": "Game developer with 8+ years creating mobile and PC games. Expert in Unity, C#, and game design principles. Published multiple successful indie games.",
                "location": "Los Angeles, CA",
                "skills": "C#,Unity,Game Design,Mobile Development,Steam,Performance Optimization,3D Graphics,Animation",
                "expertise": "Game Development,Unity Engine,Mobile Games,Indie Game Development,Game Design Principles",
                "experience_years": 8,
                "languages_spoken": "English",
                "availability": "weekends",
                "hourly_rate": 100.0,
                "linkedin_url": "https://linkedin.com/in/ryan-oconnor-gamedev",
                "company": "Independent Game Studio",
                "job_title": "Senior Game Developer"
            }
        ]

# ...rest of existing code...
    
    def _get_random_career_goals(self) -> List[str]:
        """Generate random career goals"""
        goals = [
            "Software Engineer", "Senior Developer", "Tech Lead", "Engineering Manager",
            "Data Scientist", "ML Engineer", "DevOps Engineer", "Cloud Architect",
            "Product Manager", "Startup Founder", "Freelancer", "Consultant"
        ]
        return goals

    def clear_existing_data(self, session: Session) -> None:
        """Clear existing data to enable fresh seeding"""
        logger.info("🧹 Clearing existing data...")
        
        # Clear all user profiles
        statement = select(UserProfile)
        users = session.exec(statement).all()
        for user in users:
            session.delete(user)
        
        session.commit()
        logger.info(f"🗑️ Cleared {len(users)} existing users")

    def seed_users(self, session: Session) -> Dict[str, Any]:
        """Seed learner user profiles"""
        logger.info("👥 Seeding learner users...")
        
        users_created = []
        for user_data in self.users_data:
            try:
                user = UserProfile(
                    full_name=user_data["full_name"],
                    email=user_data["email"],
                    hashed_password=hash_password(user_data["password"]),
                    phone_number=user_data.get("phone_number"),
                    bio=user_data.get("bio"),
                    location=user_data.get("location"),
                    is_mentor=False,  # Mark as learner
                    learning_goal=user_data.get("learning_goal"),
                    preferred_language=user_data.get("preferred_language"),
                    time_zone=user_data.get("time_zone"),
                    learning_style=user_data.get("learning_style"),
                    experience_level=user_data.get("experience_level"),
                    availability=user_data.get("availability"),
                    skills_interested=user_data.get("skills_interested", ""),
                    current_skills=user_data.get("current_skills", "")
                )
                session.add(user)
                users_created.append(user_data["email"])
                logger.info(f"➕ Adding user: {user_data['full_name']}")
                
            except Exception as e:
                logger.error(f"❌ Failed to create user {user_data['email']}: {str(e)}")
        
        session.commit()
        logger.info(f"✅ Created {len(users_created)} learner users")
        return {"created": len(users_created), "users": users_created}

    def seed_mentors(self, session: Session) -> Dict[str, Any]:
        """Seed mentor profiles as UserProfile with is_mentor=True"""
        logger.info("🧑‍🏫 Seeding mentors...")
        
        mentors_created = []
        for mentor_data in self.mentors_data:
            try:
                mentor = UserProfile(
                    full_name=mentor_data["full_name"],
                    email=mentor_data["email"],
                    hashed_password=hash_password(mentor_data["password"]),
                    phone_number=mentor_data.get("phone_number"),
                    bio=mentor_data.get("bio"),
                    location=mentor_data.get("location"),
                    is_mentor=True,  # This is crucial!
                    
                    # Mentor-specific fields
                    skills=mentor_data["skills"],
                    expertise=mentor_data["expertise"],
                    experience_years=mentor_data["experience_years"],
                    languages_spoken=mentor_data["languages_spoken"],
                    mentor_availability=mentor_data["availability"],
                    hourly_rate=mentor_data.get("hourly_rate", 0.0),
                    linkedin_url=mentor_data.get("linkedin_url"),
                    company=mentor_data.get("company"),
                    job_title=mentor_data.get("job_title")
                )
                session.add(mentor)
                mentors_created.append(mentor_data["email"])
                logger.info(f"➕ Adding mentor: {mentor_data['full_name']}")
                
            except Exception as e:
                logger.error(f"❌ Failed to create mentor {mentor_data['email']}: {str(e)}")
        
        session.commit()
        logger.info(f"✅ Created {len(mentors_created)} mentors")
        return {"created": len(mentors_created), "mentors": mentors_created}

    def run_complete_seed(self, force_clear: bool = False):
        """Run complete database seeding"""
        logger.info("🚀 Starting database seeding...")
        
        # Create all tables
        SQLModel.metadata.create_all(engine)
        
        with Session(engine) as session:
            try:
                results = {}
                
                # Optionally clear existing data
                if force_clear:
                    self.clear_existing_data(session)
                
                # Seed users (learners)
                results["users"] = self.seed_users(session)
                
                # Seed mentors
                results["mentors"] = self.seed_mentors(session)
                
                logger.info("🎉 Database seeding completed successfully!")
                return results
                
            except Exception as e:
                logger.error(f"❌ Seeding failed: {str(e)}")
                session.rollback()
                raise


def main():
    """Main seeding function"""
    # Force clear existing data and reseed
    seeder = DataSeeder()
    results = seeder.run_complete_seed(force_clear=True)
    
    print("\n" + "="*50)
    print("📊 SEEDING RESULTS SUMMARY")
    print("="*50)
    for category, result in results.items():
        if isinstance(result, dict) and "created" in result:
            print(f"✅ {category.capitalize()}: {result['created']} created")
    print("="*50)
    print("🎯 Database ready for SkillBridge recommendation system!")
    
    # Show skills data summary
    seeder = DataSeeder()
    print(f"\n📚 Skills Database: {len(seeder.skills_data)} skills across multiple categories")
    categories = set(skill["category"] for skill in seeder.skills_data)
    print(f"🏷️ Categories: {', '.join(sorted(categories))}")


if __name__ == "__main__":
    main()