from fastapi import FastAPI, HTTPException
from models import AddInput, ChallengeSubmission
from matlab_engine import MatlabEngineWrapper
import matlab.engine
from typing import Union

app = FastAPI(title="Electrical Eng LeetCode Backend", version="0.1.0")

@app.get("/")
def root():
    return {"msg": "Electrical Eng LeetCode MATLAB backend is online"}

@app.post("/compute/add")
def add_numbers(payload: AddInput):
    eng = MatlabEngineWrapper.get_instance()
    try:
        # Direct call to MATLAB's plus function (defensive: assuming payload is already validated)
        result = eng.plus(payload.a, payload.b)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MATLAB computation failed: {str(e)}")

@app.post("/challenge/solve")
def solve_challenge(payload: ChallengeSubmission):
    eng = MatlabEngineWrapper.get_instance()
    try:
        # Defensive: ensure problem_id is a valid identifier to avoid injection shenanigans.
        if not payload.problem_id.isidentifier():
            raise HTTPException(status_code=400, detail="Invalid problem_id format.")
        
        # Construct MATLAB function name. E.g., if problem_id is 'rc_circuit', expect MATLAB function 'solve_rc_circuit'.
        function_name = "solve_" + payload.problem_id
        
        # Convert inputs to MATLAB double array.
        matlab_inputs = matlab.double(payload.inputs)
        
        # Call the MATLAB function using feval. (Assumes the function returns a numeric result.)
        result = eng.feval(function_name, matlab_inputs)
        
        # Convert MATLAB result to a Python-friendly format.
        # If it's a single number, it's fine; if it's array-like, try converting to list.
        if isinstance(result, (float, int)):
            py_result = result
        else:
            try:
                py_result = list(result)
            except Exception:
                py_result = result
        
        # Compare MATLAB result with expected output using a small tolerance.
        passed = False
        tolerance = 1e-6
        if isinstance(payload.expected_output, list):
            if isinstance(py_result, list) and len(py_result) == len(payload.expected_output):
                passed = all(abs(a - b) < tolerance for a, b in zip(py_result, payload.expected_output))
        else:
            try:
                passed = abs(float(py_result) - payload.expected_output) < tolerance
            except Exception:
                passed = False
        
        return {"result": py_result, "passed": passed}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during challenge solution: {str(e)}")
