import { useEffect, useState } from "react";
import "./App.css";

interface ApiResponse {
  message: string;
  timestamp: string;
}

function App() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json() as Promise<ApiResponse>;
      })
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="home">
      <h1>Job Finder</h1>
      <p className="subtitle">React + TypeScript frontend connected to a Node.js API</p>

      <section className="card">
        <h2>Backend Response</h2>
        {loading && <p className="status">Loading...</p>}
        {error && <p className="status error">{error}</p>}
        {data && (
          <div className="response">
            <p className="message">{data.message}</p>
            <p className="timestamp">
              Received at {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
