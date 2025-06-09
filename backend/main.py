from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import json
import asyncio
import httpx
from datetime import datetime
import logging
import os
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="GENEHIVE API",
    description="AI-powered genetic risk simulation backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Disease(BaseModel):
    id: str
    name: str
    type: str  # dominant, recessive, x-linked, multifactorial
    prevalence: float
    penetrance: float
    description: str
    color: str

class FamilyMember(BaseModel):
    id: str
    name: str
    age: int
    gender: str  # male, female
    parentIds: List[str] = []
    diseases: List[Disease] = []
    position: Optional[Dict[str, float]] = None

class GeneticRisk(BaseModel):
    memberId: str
    diseaseId: str
    riskScore: float
    explanation: str
    inheritancePattern: str
    contributingFactors: List[str]

class SimulationRequest(BaseModel):
    familyMembers: List[FamilyMember]
    diseases: List[Disease]
    simulationParams: Optional[Dict[str, Any]] = {}

class SimulationResult(BaseModel):
    risks: List[GeneticRisk]
    summary: Dict[str, Any]
    timestamp: str

class ChatMessage(BaseModel):
    role: str  # user, assistant
    content: str
    timestamp: str

class ChatRequest(BaseModel):
    message: str
    familyMembers: List[FamilyMember]
    selectedMember: Optional[FamilyMember] = None
    chatHistory: List[ChatMessage] = []

class ExplanationRequest(BaseModel):
    member: FamilyMember
    disease: Disease
    familyMembers: List[FamilyMember]

# Ollama configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

# Genetic simulation logic
class GeneticSimulator:
    @staticmethod
    def calculate_dominant_risk(member: FamilyMember, disease: Disease, family_members: List[FamilyMember]) -> float:
        """Calculate risk for dominant inheritance pattern"""
        if any(d.id == disease.id for d in member.diseases):
            return 1.0
        
        parents = [m for m in family_members if m.id in member.parentIds]
        affected_parents = sum(1 for parent in parents if any(d.id == disease.id for d in parent.diseases))
        
        if affected_parents == 0:
            return disease.prevalence
        elif affected_parents == 1:
            return 0.5 * disease.penetrance
        else:  # both parents affected
            return 0.75 * disease.penetrance
    
    @staticmethod
    def calculate_recessive_risk(member: FamilyMember, disease: Disease, family_members: List[FamilyMember]) -> float:
        """Calculate risk for recessive inheritance pattern"""
        if any(d.id == disease.id for d in member.diseases):
            return 1.0
        
        parents = [m for m in family_members if m.id in member.parentIds]
        affected_parents = sum(1 for parent in parents if any(d.id == disease.id for d in parent.diseases))
        
        # Simplified recessive calculation
        if affected_parents == 0:
            return disease.prevalence
        elif affected_parents == 1:
            return 0.25 * disease.penetrance  # Carrier risk
        else:  # both parents affected
            return disease.penetrance
    
    @staticmethod
    def calculate_xlinked_risk(member: FamilyMember, disease: Disease, family_members: List[FamilyMember]) -> float:
        """Calculate risk for X-linked inheritance pattern"""
        if any(d.id == disease.id for d in member.diseases):
            return 1.0
        
        parents = [m for m in family_members if m.id in member.parentIds]
        mother = next((p for p in parents if p.gender == 'female'), None)
        father = next((p for p in parents if p.gender == 'male'), None)
        
        if member.gender == 'male':
            # Males inherit X chromosome from mother
            if mother and any(d.id == disease.id for d in mother.diseases):
                return 0.5 * disease.penetrance
            return disease.prevalence
        else:
            # Females need two copies for expression (simplified)
            affected_parents = sum(1 for parent in parents if any(d.id == disease.id for d in parent.diseases))
            if affected_parents == 2:
                return disease.penetrance
            elif affected_parents == 1:
                return 0.1 * disease.penetrance  # Carrier with mild expression
            return disease.prevalence
    
    @staticmethod
    def calculate_multifactorial_risk(member: FamilyMember, disease: Disease, family_members: List[FamilyMember]) -> float:
        """Calculate risk for multifactorial inheritance pattern"""
        if any(d.id == disease.id for d in member.diseases):
            return 1.0
        
        # Count affected relatives
        parents = [m for m in family_members if m.id in member.parentIds]
        siblings = [m for m in family_members if m.parentIds == member.parentIds and m.id != member.id]
        
        affected_relatives = 0
        total_weight = 0
        
        # Parents have higher weight
        for parent in parents:
            if any(d.id == disease.id for d in parent.diseases):
                affected_relatives += 2
            total_weight += 2
        
        # Siblings have moderate weight
        for sibling in siblings:
            if any(d.id == disease.id for d in sibling.diseases):
                affected_relatives += 1
            total_weight += 1
        
        if total_weight == 0:
            return disease.prevalence
        
        family_loading = affected_relatives / total_weight
        base_risk = disease.prevalence
        
        # Age factor (simplified)
        age_factor = 1.0
        if member.age > 50:
            age_factor = 1.2
        elif member.age < 30:
            age_factor = 0.8
        
        return min(base_risk + (family_loading * 0.3 * disease.penetrance * age_factor), 0.95)
    
    @staticmethod
    def calculate_risk(member: FamilyMember, disease: Disease, family_members: List[FamilyMember]) -> GeneticRisk:
        """Calculate genetic risk for a member-disease pair"""
        if disease.type == "dominant":
            risk_score = GeneticSimulator.calculate_dominant_risk(member, disease, family_members)
            pattern = "Autosomal Dominant"
        elif disease.type == "recessive":
            risk_score = GeneticSimulator.calculate_recessive_risk(member, disease, family_members)
            pattern = "Autosomal Recessive"
        elif disease.type == "x-linked":
            risk_score = GeneticSimulator.calculate_xlinked_risk(member, disease, family_members)
            pattern = "X-linked"
        elif disease.type == "multifactorial":
            risk_score = GeneticSimulator.calculate_multifactorial_risk(member, disease, family_members)
            pattern = "Multifactorial"
        else:
            risk_score = disease.prevalence
            pattern = "Unknown"
        
        # Generate explanation
        parents = [m for m in family_members if m.id in member.parentIds]
        affected_parents = [p for p in parents if any(d.id == disease.id for d in p.diseases)]
        
        if any(d.id == disease.id for d in member.diseases):
            explanation = f"{member.name} currently has {disease.name}."
        elif len(affected_parents) == 0:
            explanation = f"No family history of {disease.name}. Risk based on general population prevalence."
        elif len(affected_parents) == 1:
            explanation = f"One parent has {disease.name}. {pattern} inheritance increases risk."
        else:
            explanation = f"Both parents have {disease.name}. Significantly elevated risk due to {pattern} inheritance."
        
        contributing_factors = []
        if len(affected_parents) > 0:
            contributing_factors.append(f"{len(affected_parents)} affected parent(s)")
        if member.age > 50 and disease.type == "multifactorial":
            contributing_factors.append("Advanced age")
        
        return GeneticRisk(
            memberId=member.id,
            diseaseId=disease.id,
            riskScore=risk_score,
            explanation=explanation,
            inheritancePattern=pattern,
            contributingFactors=contributing_factors
        )

# Ollama integration
class OllamaService:
    @staticmethod
    async def generate_response(prompt: str, context: str = "") -> str:
        """Generate AI response using Ollama"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "model": OLLAMA_MODEL,
                    "prompt": f"{context}\n\nUser: {prompt}\n\nAssistant:",
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_tokens": 500
                    }
                }
                
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "I apologize, but I couldn't generate a response at this time.")
                else:
                    logger.error(f"Ollama API error: {response.status_code}")
                    return "I'm currently unable to connect to the AI service. Please try again later."
                    
        except Exception as e:
            logger.error(f"Error calling Ollama: {str(e)}")
            return "I'm experiencing technical difficulties. Please try again later."
    
    @staticmethod
    def build_family_context(family_members: List[FamilyMember], selected_member: Optional[FamilyMember] = None) -> str:
        """Build context about the family for AI responses"""
        context = "Family Tree Context:\n"
        
        for member in family_members:
            diseases_str = ", ".join([d.name for d in member.diseases]) if member.diseases else "None"
            context += f"- {member.name} ({member.gender}, age {member.age}): Conditions: {diseases_str}\n"
        
        if selected_member:
            context += f"\nCurrently discussing: {selected_member.name}\n"
        
        context += "\nYou are a genetic counselor AI assistant helping to explain hereditary disease risks in families. Provide clear, accurate, and empathetic explanations."
        
        return context

# API Routes
@app.get("/")
async def root():
    return {"message": "GENEHIVE API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Ollama connection
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            ollama_status = "connected" if response.status_code == 200 else "disconnected"
    except:
        ollama_status = "disconnected"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "running",
            "ollama": ollama_status
        }
    }

@app.post("/api/simulate", response_model=SimulationResult)
async def run_simulation(request: SimulationRequest):
    """Run genetic risk simulation"""
    try:
        risks = []
        
        for member in request.familyMembers:
            for disease in request.diseases:
                risk = GeneticSimulator.calculate_risk(member, disease, request.familyMembers)
                risks.append(risk)
        
        # Generate summary statistics
        high_risk_count = sum(1 for risk in risks if risk.riskScore >= 0.7)
        moderate_risk_count = sum(1 for risk in risks if 0.3 <= risk.riskScore < 0.7)
        
        summary = {
            "totalRisks": len(risks),
            "highRiskCount": high_risk_count,
            "moderateRiskCount": moderate_risk_count,
            "lowRiskCount": len(risks) - high_risk_count - moderate_risk_count,
            "averageRisk": sum(risk.riskScore for risk in risks) / len(risks) if risks else 0
        }
        
        return SimulationResult(
            risks=risks,
            summary=summary,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Simulation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    """Chat with AI about genetic risks"""
    try:
        context = OllamaService.build_family_context(request.familyMembers, request.selectedMember)
        
        # Add chat history to context
        if request.chatHistory:
            context += "\n\nPrevious conversation:\n"
            for msg in request.chatHistory[-5:]:  # Last 5 messages for context
                context += f"{msg.role.title()}: {msg.content}\n"
        
        response = await OllamaService.generate_response(request.message, context)
        
        return {
            "response": response,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.post("/api/explain")
async def get_personalized_explanation(request: ExplanationRequest):
    """Get personalized AI explanation for a specific risk"""
    try:
        # Calculate the risk first
        risk = GeneticSimulator.calculate_risk(request.member, request.disease, request.familyMembers)
        
        # Build detailed context for explanation
        context = OllamaService.build_family_context(request.familyMembers, request.member)
        
        prompt = f"""Explain why {request.member.name} has a {risk.riskScore*100:.1f}% risk of developing {request.disease.name}. 
        
Consider:
        - The {risk.inheritancePattern} inheritance pattern
        - Family history and affected relatives
        - Age and other risk factors
        - Provide reassurance and practical advice
        
Keep the explanation clear, empathetic, and under 200 words."""
        
        explanation = await OllamaService.generate_response(prompt, context)
        
        return {
            "explanation": explanation,
            "riskScore": risk.riskScore,
            "inheritancePattern": risk.inheritancePattern,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Explanation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")

@app.get("/api/diseases")
async def get_diseases():
    """Get list of available diseases"""
    # This would typically come from a database
    diseases = [
        {
            "id": "huntington",
            "name": "Huntington's Disease",
            "type": "dominant",
            "prevalence": 0.0001,
            "penetrance": 0.95,
            "description": "A progressive brain disorder caused by a defective gene.",
            "color": "#ef4444"
        },
        {
            "id": "cystic-fibrosis",
            "name": "Cystic Fibrosis",
            "type": "recessive",
            "prevalence": 0.0004,
            "penetrance": 0.99,
            "description": "A genetic disorder affecting the lungs and digestive system.",
            "color": "#3b82f6"
        },
        {
            "id": "color-blindness",
            "name": "Color Blindness",
            "type": "x-linked",
            "prevalence": 0.08,
            "penetrance": 0.95,
            "description": "Difficulty distinguishing certain colors.",
            "color": "#10b981"
        },
        {
            "id": "diabetes-t2",
            "name": "Type 2 Diabetes",
            "type": "multifactorial",
            "prevalence": 0.11,
            "penetrance": 0.8,
            "description": "A chronic condition affecting blood sugar regulation.",
            "color": "#f59e0b"
        },
        {
            "id": "heart-disease",
            "name": "Coronary Heart Disease",
            "type": "multifactorial",
            "prevalence": 0.06,
            "penetrance": 0.7,
            "description": "Disease of the blood vessels supplying the heart.",
            "color": "#ef4444"
        }
    ]
    
    return {"diseases": diseases}

@app.post("/api/export")
async def export_family_data(family_data: Dict[str, Any]):
    """Export family tree data"""
    try:
        # Add metadata
        export_data = {
            **family_data,
            "exportDate": datetime.now().isoformat(),
            "version": "1.0.0"
        }
        
        return export_data
        
    except Exception as e:
        logger.error(f"Export error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)