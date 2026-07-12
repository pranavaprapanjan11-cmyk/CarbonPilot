import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["dashboard-api"])

# Response Schemas
class DepartmentOut(BaseModel):
    id: int
    name: str
    esg: int
    env: int
    soc: int
    gov: int
    carbon: float
    target: float

    class Config:
        from_attributes = True

class CarbonLogOut(BaseModel):
    id: int
    month: str
    emissions: float
    target: float

    class Config:
        from_attributes = True

class ChallengeOut(BaseModel):
    id: int
    title: str
    description: str
    xp_reward: int
    icon: str
    participants: int

    class Config:
        from_attributes = True

class RewardOut(BaseModel):
    id: int
    name: str
    cost: int
    stock: int

    class Config:
        from_attributes = True

class AIInsightOut(BaseModel):
    id: int
    type: str
    category: str
    impact: str
    text: str
    is_applied: bool

    class Config:
        from_attributes = True

class DashboardState(BaseModel):
    esg: int
    env: int
    soc: int
    gov: int
    ytd_emissions: float
    xp: int
    departments: List[DepartmentOut]
    carbon_data: List[CarbonLogOut]
    challenges: List[ChallengeOut]
    rewards: List[RewardOut]
    insights: List[AIInsightOut]
    joined_challenges: List[int]

# 1. Fetch Dashboard State (Rollups + Detailed metrics)
@router.get("/dashboard", response_model=DashboardState)
def get_dashboard(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    depts = db.query(models.Department).all()
    logs = db.query(models.CarbonLog).all()
    challs = db.query(models.Challenge).all()
    rems = db.query(models.Reward).all()
    insights = db.query(models.AIInsight).all()
    
    # User's joined challenges
    joined = db.query(models.UserChallenge).filter(
        models.UserChallenge.user_id == current_user.id
    ).all()
    joined_ids = [j.challenge_id for j in joined]

    # Calculate average scores
    if depts:
        avg_esg = round(sum(d.esg for d in depts) / len(depts))
        avg_env = round(sum(d.env for d in depts) / len(depts))
        avg_soc = round(sum(d.soc for d in depts) / len(depts))
        avg_gov = round(sum(d.gov for d in depts) / len(depts))
        ytd_emissions = round(sum(d.carbon for d in depts), 1)
    else:
        avg_esg, avg_env, avg_soc, avg_gov, ytd_emissions = 70, 70, 70, 70, 0.0

    return {
        "esg": avg_esg,
        "env": avg_env,
        "soc": avg_soc,
        "gov": avg_gov,
        "ytd_emissions": ytd_emissions,
        "xp": current_user.xp_points,
        "departments": depts,
        "carbon_data": logs,
        "challenges": challs,
        "rewards": rems,
        "insights": insights,
        "joined_challenges": joined_ids
    }

# 2. Run Operations Simulation
@router.post("/simulation")
def simulate_operations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    depts = db.query(models.Department).all()
    if not depts:
        raise HTTPException(status_code=404, detail="No departments found")
        
    for d in depts:
        change = random.randint(-12, 12)
        d.carbon = max(10.0, d.carbon + change)
        
        # Environmental changes based on target limit
        if d.carbon <= d.target:
            d.env = min(100, d.env + random.randint(0, 3))
        else:
            d.env = max(20, d.env - random.randint(1, 5))
            
        d.soc = max(30, min(100, d.soc + (2 if random.random() > 0.45 else -2)))
        d.gov = max(30, min(100, d.gov + (1 if random.random() > 0.5 else -2)))
        d.esg = round((d.env * 0.4) + (d.soc * 0.3) + (d.gov * 0.3))
        
    # Randomly fluctuate carbon logs curve
    logs = db.query(models.CarbonLog).all()
    for l in logs:
        l.emissions = max(40.0, l.emissions + random.randint(-5, 5))
        
    db.commit()
    return {"message": "Simulation run complete. Database state updated successfully."}

# 3. Apply AI Recommendation
@router.post("/optimize/{insight_type}")
def apply_optimization(
    insight_type: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    insight = db.query(models.AIInsight).filter(models.AIInsight.type == insight_type).first()
    if not insight:
        raise HTTPException(status_code=404, detail="AI Recommendation profile not found")
    if insight.is_applied:
        raise HTTPException(status_code=400, detail="Recommendation already implemented")
        
    if insight_type == "fleet":
        logistics = db.query(models.Department).filter(models.Department.name == "Global Logistics").first()
        if logistics:
            logistics.carbon = max(50.0, logistics.carbon - 130.0)
            logistics.env = min(100, logistics.env + 30)
            logistics.esg = round((logistics.env * 0.4) + (logistics.soc * 0.3) + (logistics.gov * 0.3))
            
            # Slightly decrease global logs too
            logs = db.query(models.CarbonLog).all()
            for l in logs:
                l.emissions = max(40.0, l.emissions - 10.0)
                
    elif insight_type == "audits":
        mfg = db.query(models.Department).filter(models.Department.name == "Manufacturing").first()
        if mfg:
            mfg.gov = min(100, mfg.gov + 25)
            mfg.esg = round((mfg.env * 0.4) + (mfg.soc * 0.3) + (mfg.gov * 0.3))
            
    insight.is_applied = True
    db.commit()
    return {"message": f"Applied AI {insight_type} optimization successfully."}

# 4. Join Challenge
@router.post("/challenges/{challenge_id}/join")
def join_challenge(
    challenge_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chall = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not chall:
        raise HTTPException(status_code=404, detail="Challenge target not found")
        
    already_joined = db.query(models.UserChallenge).filter(
        models.UserChallenge.user_id == current_user.id,
        models.UserChallenge.challenge_id == challenge_id
    ).first()
    
    if already_joined:
        raise HTTPException(status_code=400, detail="Already enrolled in this challenge")
        
    # Enlist new participation
    enrolment = models.UserChallenge(user_id=current_user.id, challenge_id=challenge_id)
    db.add(enrolment)
    
    # Credit XP
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    user.xp_points += 150
    
    # Increment participant metric
    chall.participants += 1
    
    # Boost Social rating average globally
    depts = db.query(models.Department).all()
    for d in depts:
        d.soc = min(100, d.soc + 3)
        d.esg = round((d.env * 0.4) + (d.soc * 0.3) + (d.gov * 0.3))
        
    db.commit()
    return {"message": "Enrolled in challenge. +150 XP awarded.", "new_xp": user.xp_points}

# 5. Redeem Rewards
@router.post("/rewards/{reward_id}/redeem")
def redeem_reward(
    reward_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reward = db.query(models.Reward).filter(models.Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward item not found")
    if reward.stock <= 0:
        raise HTTPException(status_code=400, detail="Reward is out of stock")
    if current_user.xp_points < reward.cost:
        raise HTTPException(status_code=400, detail="Insufficient XP balance")
        
    # Process transactional deduction
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    user.xp_points -= reward.cost
    reward.stock -= 1
    
    # Save redemption receipt
    receipt = models.Redemption(
        user_id=user.id,
        reward_id=reward.id,
        cost_paid=reward.cost
    )
    db.add(receipt)
    db.commit()
    
    return {"message": f"Successfully claimed: {reward.name}.", "new_xp": user.xp_points}

# 6. Hard-Reset State Back to baseline
@router.post("/dashboard/reset")
def reset_dashboard(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Clear existing entries
        db.query(models.Department).delete()
        db.query(models.CarbonLog).delete()
        db.query(models.Challenge).delete()
        db.query(models.Reward).delete()
        db.query(models.AIInsight).delete()
        db.query(models.UserChallenge).delete()
        db.query(models.Redemption).delete()
        
        # Reset current user XP
        user = db.query(models.User).filter(models.User.id == current_user.id).first()
        user.xp_points = 1250

        # Seed baseline departments
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
            
        # Seed Carbon trend curves
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        emissions = [195, 182, 170, 165, 155, 142, 138, 140, 132, 125, 118, 110]
        targets = [170, 165, 160, 155, 150, 145, 140, 135, 130, 125, 120, 115]
        
        for m, e, t in zip(months, emissions, targets):
            db.add(models.CarbonLog(month=m, emissions=e, target=t))
            
        # Seed Challenges
        db.add(models.Challenge(title="Cycle to Work Month", description="Earn 500 XP. 42 participants enrolled.", xp_reward=500, icon="bicycle", participants=42))
        db.add(models.Challenge(title="Paperless Office Campaign", description="Earn 200 XP. 87 participants enrolled.", xp_reward=200, icon="file-text-o", participants=87))
        db.add(models.Challenge(title="Zero Carbon Weekend", description="Earn 350 XP. 14 participants enrolled.", xp_reward=350, icon="plug", participants=14))
        
        # Seed Rewards Shop Items
        db.add(models.Reward(name="Extra Paid Leave Day", cost=1000, stock=4))
        db.add(models.Reward(name="$20 Amazon Gift Card", cost=300, stock=12))
        db.add(models.Reward(name="Premium Coffee Mug", cost=150, stock=8))
        db.add(models.Reward(name="Tree Dedication planting", cost=200, stock=24))
        
        # Seed AI recommendations
        db.add(models.AIInsight(type="fleet", category="Environmental fleet", impact="18% Reduction", text="Department 'Global Logistics' is exceeding carbon budget limits by 130 tCO2e. Recommending switching 30% of their operational fleet vehicles to Electric Vehicles (EVs).", is_applied=False))
        db.add(models.AIInsight(type="audits", category="Governance compliance", impact="12% Rating Rise", text="Detected 6 overdue audit filings in Manufacturing. Directing notifications to remediation owners will lower risks and raise compliance ratings.", is_applied=False))
        
        db.commit()
        return {"message": "All parameters successfully restored to defaults."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database wipe failed: {str(e)}")

# 7. Mock PDF / JSON ESG summary report endpoint
@router.get("/reports/esg_summary")
def generate_summary(db: Session = Depends(get_db)):
    depts = db.query(models.Department).all()
    if depts:
        avg_esg = round(sum(d.esg for d in depts) / len(depts))
        avg_env = round(sum(d.env for d in depts) / len(depts))
        avg_soc = round(sum(d.soc for d in depts) / len(depts))
        avg_gov = round(sum(d.gov for d in depts) / len(depts))
        total_carbon = round(sum(d.carbon for d in depts), 1)
    else:
        avg_esg, avg_env, avg_soc, avg_gov, total_carbon = 70, 70, 70, 70, 0.0

    return {
        "report_title": "EcoSphere AI - Annual ESG Audit summary",
        "generated_at": datetime.utcnow().isoformat(),
        "aggregate_kpis": {
            "overall_esg": avg_esg,
            "environmental": avg_env,
            "social": avg_soc,
            "governance": avg_gov,
            "total_co2e_tons": total_carbon
        },
        "departmental_scores": [
            {
                "name": d.name,
                "overall_esg": d.esg,
                "current_emissions": d.carbon,
                "target_emissions": d.target,
                "status": "Exceeded Limit" if d.carbon > d.target else "Target MET"
            } for d in depts
        ],
        "remitted_by": "EcoSphere AI Automated Certification Engine"
    }
