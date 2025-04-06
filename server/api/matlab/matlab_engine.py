import matlab.engine
import threading

class MatlabEngineWrapper:
    _lock = threading.Lock()
    _instance = None

    @classmethod
    def get_instance(cls):
        with cls._lock:
            if cls._instance is None:
                try:
                    print("Starting MATLAB engine... hang tight.")
                    cls._instance = matlab.engine.start_matlab()
                    print("MATLAB engine is up, fam.")
                except Exception as e:
                    print("Error starting MATLAB engine:", e)
                    raise
            return cls._instance
