from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Token(BaseModel):
    # Додали типи "real" та "imaginary"
    type: str  
    value: str = ""
    re: float = 0.0
    im: float = 0.0

class CalcRequest(BaseModel):
    tokens: List[Token]

@app.post("/calculate")
async def calculate(req: CalcRequest):
    if not req.tokens:
        return {"re": 0.0, "im": 0.0}

    expr_str = ""
    for t in req.tokens:
        if t.type == "complex":
            expr_str += f"complex({t.re}, {t.im})"
        elif t.type == "real":
            # Звичайне число (уявна частина 0)
            expr_str += f"complex({t.re}, 0)"
        elif t.type == "imaginary":
            # Суто уявне число (дійсна частина 0)
            expr_str += f"complex(0, {t.im})"
            
        elif t.type == "operator":
            if t.value == "×": expr_str += "*"
            elif t.value == "÷": expr_str += "/"
            else: expr_str += t.value  
        elif t.type == "paren_open":
            expr_str += "("
        elif t.type == "paren_close":
            expr_str += ")"
        elif t.type == "power":
            expr_str += f"**({t.value if t.value else '1'})"

    try:
        # Безпечне обчислення
        res = eval(expr_str, {"__builtins__": None}, {"complex": complex})
        
        return {
            "re": round(res.real, 4) if abs(res.real) > 1e-8 else 0.0,
            "im": round(res.imag, 4) if abs(res.imag) > 1e-8 else 0.0
        }
        
    except SyntaxError:
        raise HTTPException(status_code=400, detail="Синтаксична помилка. Перевірте, чи всі дужки закриті і чи правильно стоять оператори.")
    except ZeroDivisionError:
        raise HTTPException(status_code=400, detail="Помилка: Ділення на нуль!")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Математична помилка: Неправильний формат виразу.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)