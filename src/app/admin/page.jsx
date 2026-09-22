"use client";

import { useAuth } from "@/lib/auth-context";
import { getAllUsers } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    if (ADMIN_EMAIL && user.email !== ADMIN_EMAIL) { setError("Access denied. Admin only."); setFetching(false); return; }
    (async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (e) { setError("Failed to fetch users: " + e.message); }
      finally { setFetching(false); }
    })();
  }, [user]);

  if (loading) return <div className="app-loading"><div className="loading-spinner loading-spinner--large"></div></div>;
  if (!user) return null;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div><h1 className="admin-title">🛡️ Admin Panel</h1><p className="admin-subtitle">Manage registered users</p></div>
        <Link href="/" className="btn btn--secondary">← Back to Chat</Link>
      </div>
      {error && <p className="form-error" style={{textAlign:"center",marginBottom:20}}>{error}</p>}
      {fetching ? (
        <div className="app-loading"><div className="loading-spinner"></div></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>#</th><th>Name</th><th>Email</th><th>PIN</th><th>Registered</th></tr></thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td>{i + 1}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><code className="pin-code">{u.pin}</code></td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} style={{textAlign:"center",padding:40,color:"var(--text-muted)"}}>No users registered yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
