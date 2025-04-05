from flask import Flask, request, jsonify
import matlab.engine

app = Flask(__name__)

# Start MATLAB engine (this might take a moment on first run)
print("Starting MATLAB engine...")
eng = matlab.engine.start_matlab()
print("MATLAB engine started.")

@app.route('/execute', methods=['POST'])
def execute_matlab():
    data = request.get_json()
    try:
        # Expect an input value (e.g., a number)
        input_val = data.get("input", None)
        if input_val is None:
            raise ValueError("Missing 'input' parameter in request.")
        
        # Convert to float for MATLAB if needed
        matlab_input = float(input_val)
        
        # Call the MATLAB function 'solveProblem'
        # Make sure solveProblem.m is available on MATLAB's path.
        result = eng.solveProblem(matlab_input)
        
        # Return the MATLAB function output as JSON
        return jsonify({"output": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
