from typing import List, Union
from pydantic import BaseModel, Field

class AddInput(BaseModel):
    a: float = Field(..., description="First number to add")
    b: float = Field(..., description="Second number to add")

class ChallengeSubmission(BaseModel):
    problem_id: str = Field(
        ...,
        description="ID of the electrical engineering problem. Example: 'add' for a basic addition challenge."
    )
    inputs: List[float] = Field(..., description="Input values for the problem")
    expected_output: Union[float, List[float]] = Field(
        ...,
        description="Expected output result to validate against MATLAB’s computation."
    )
