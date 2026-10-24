import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Connecting to Django...");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/hello/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to connect to Django");
        }
        return response.json();
      })
      .then((data) => {
        setMessage(data.message);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  return (
    <div>
      <h1>React + Django</h1>
      {error ? (
        <p>Error: {error}</p>
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
}

export default App;