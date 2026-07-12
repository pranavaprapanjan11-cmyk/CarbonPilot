import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
from database import engine, Base, get_db
import auth
import routes

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EcoSphere AI API",
    description="FastAPI Backend for the ESG platform",
    version="1.0.0"
)

# Setup CORS Policy for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows standard Dev ports (5173) and Netlify hosts
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

# Connect Routers
app.include_router(auth.router)
app.include_router(routes.router)

# Mount static folder
app.mount("/static", StaticFiles(directory="static"), name="static")

# Seed initial baseline database on startup if empty
@app.on_event("startup")
def startup_seeding():
    db = next(get_db())
    try:
        # Check if database is empty by querying users
        user_count = db.query(models.User).count()
        if user_count == 0:
            print("EcoSphere AI Backend: Seeding initial developer baseline database...")
            
            # 1. Seed Default User (Credentials: admin@ecosphere.ai / adminpass)
            default_user = models.User(
                email="admin@ecosphere.ai",
                hashed_password=auth.get_password_hash("adminpass"),
                full_name="Eco Admin User",
                role="admin",
                xp_points=1250
            )
            db.add(default_user)
            
            # 2. Seed baseline departments
            baselines = [
                {"name": "Administration", "esg": 88, "env": 90, "soc": 85, "gov": 90, "carbon": 180.0, "target": 200.0},
                {"name": "Finance & Acc.", "esg": 78, "env": 80, "soc": 75, "gov": 80, "carbon": 140.0, "target": 150.0},
                {"name": "Research & Dev.", "esg": 85, "env": 88, "soc": 80, "gov": 88, "carbon": 220.0, "target": 250.0},
                {"name": "Product Eng.", "esg": 94, "env": 96, "soc": 90, "gov": 96, "carbon": 310.0, "target": 400.0},
                {"name": "Sales & Mktg.", "esg": 72, "env": 75, "soc": 70, "gov": 72, "carbon": 120.0, "target": 130.0},
                {"name": "Customer Success", "esg": 80, "env": 82, "soc": 78, "gov": 80, "carbon": 90.0, "target": 100.0},
                {"name": "Global Logistics", "esg": 48, "env": 40, "soc": 50, "gov": 55, "carbon": 480.0, "target": 350.0},
                {"name": "Manufacturing", "esg": 62, "env": 58, "soc": 65, "gov": 64, "carbon": 410.0, "target": 380.0},
                {"name": "Legal & Risk", "esg": 90, "env": 92, "soc": 88, "gov": 90, "carbon": 50.0, "target": 70.0},
                {"name": "IT Infrastructure", "esg": 84, "env": 86, "soc": 82, "gov": 84, "carbon": 280.0, "target": 300.0}
            ]
            for b in baselines:
                db.add(models.Department(**b))
                
            # 3. Seed Carbon trend curves
            months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            emissions = [195, 182, 170, 165, 155, 142, 138, 140, 132, 125, 118, 110]
            targets = [170, 165, 160, 155, 150, 145, 140, 135, 130, 125, 120, 115]
            
            for m, e, t in zip(months, emissions, targets):
                db.add(models.CarbonLog(month=m, emissions=e, target=t))
                
            # 4. Seed Challenges
            db.add(models.Challenge(title="Cycle to Work Month", description="Earn 500 XP. 42 participants enrolled.", xp_reward=500, icon="bicycle", participants=42))
            db.add(models.Challenge(title="Paperless Office Campaign", description="Earn 200 XP. 87 participants enrolled.", xp_reward=200, icon="file-text-o", participants=87))
            db.add(models.Challenge(title="Zero Carbon Weekend", description="Earn 350 XP. 14 participants enrolled.", xp_reward=350, icon="plug", participants=14))
            
            # 5. Seed Rewards Shop Items
            db.add(models.Reward(name="Extra Paid Leave Day", cost=1000, stock=4))
            db.add(models.Reward(name="$20 Amazon Gift Card", cost=300, stock=12))
            db.add(models.Reward(name="Premium Coffee Mug", cost=150, stock=8))
            db.add(models.Reward(name="Tree Dedication planting", cost=200, stock=24))
            
            # 6. Seed AI recommendations
            db.add(models.AIInsight(type="fleet", category="Environmental fleet", impact="18% Reduction", text="Department 'Global Logistics' is exceeding carbon budget limits by 130 tCO2e. Recommending switching 30% of their operational fleet vehicles to Electric Vehicles (EVs).", is_applied=False))
            db.add(models.AIInsight(type="audits", category="Governance compliance", impact="12% Rating Rise", text="Detected 6 overdue audit filings in Manufacturing. Directing notifications to remediation owners will lower risks and raise compliance ratings.", is_applied=False))
            
            db.commit()
            print("EcoSphere AI Backend: Seeding complete.")
    except Exception as e:
        db.rollback()
        print(f"EcoSphere AI Backend: Seeding error: {str(e)}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "EcoSphere AI Standalone API Service",
        "author": "Antigravity Dev Team",
        "docs_url": "/docs"
    }
