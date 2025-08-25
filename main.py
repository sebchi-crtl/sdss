from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import uvicorn

class Req(BaseModel):
    horizon_hours: List[int]

app = FastAPI()

@app.post("/predict")
def predict(req: Req):
    horizon = req.horizon_hours
    risk = [min(1.0, 0.2 + 0.01 * h) for h in horizon]
    return {"horizon": horizon, "risk": risk}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8200)
