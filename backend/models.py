from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base

# Association table for User-Challenge (Many-to-Many)
class UserChallenge(Base):
    __tablename__ = "user_challenges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"))
    status = Column(String, default="joined")  # joined, completed
    enrolled_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="employee")  # admin, employee
    xp_points = Column(Integer, default=1250)
    created_at = Column(DateTime, default=datetime.utcnow)

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    esg = Column(Integer, default=70)
    env = Column(Integer, default=70)
    soc = Column(Integer, default=70)
    gov = Column(Integer, default=70)
    carbon = Column(Float, default=100.0)
    target = Column(Float, default=100.0)

class CarbonLog(Base):
    __tablename__ = "carbon_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    month = Column(String, nullable=False)  # Jan, Feb, etc.
    emissions = Column(Float, nullable=False)
    target = Column(Float, nullable=False)

class Challenge(Base):
    __tablename__ = "challenges"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    xp_reward = Column(Integer, nullable=False)
    icon = Column(String, nullable=False)  # bicycle, file-text-o, plug
    participants = Column(Integer, default=0)

class Reward(Base):
    __tablename__ = "rewards"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    cost = Column(Integer, nullable=False)
    stock = Column(Integer, default=10)

class Redemption(Base):
    __tablename__ = "redemptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reward_id = Column(Integer, ForeignKey("rewards.id", ondelete="CASCADE"), nullable=False)
    cost_paid = Column(Integer, nullable=False)
    redeemed_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
    reward = relationship("Reward")

class AIInsight(Base):
    __tablename__ = "ai_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # fleet, audits
    category = Column(String, nullable=False)
    impact = Column(String, nullable=False)
    text = Column(String, nullable=False)
    is_applied = Column(Boolean, default=False)
