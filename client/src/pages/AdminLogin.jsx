import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function AdminLogin() {

  const nav = useNavigate();

  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");

  const onLogin = async () => {

    try {

      const res = await fetch("http://localhost:5000/api/auth/admin/login",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ username,password })
      });

      const data = await res.json().catch(()=>({}));

      if(!res.ok || !data.ok){
        alert(data.message || "Admin login failed ❌");
        return;
      }

      localStorage.setItem("servespot_admin_token",data.token);
      localStorage.setItem("servespot_admin",JSON.stringify(data.admin));

      alert("Admin login success ✅");

      nav("/admin/dashboard");

    }catch(e){

      alert("Server not running ❌");

    }

  };

  return (

    <div style={styles.page}>

      {/* ✅ HEADER */}
      <header style={styles.header}>

        <div style={styles.brand}>
          ServeSpot
        </div>

        <Link to="/" style={styles.homeBtn}>
          Home
        </Link>

      </header>

      {/* LOGIN CARD */}
      <div style={styles.center}>

        <div style={styles.card}>

          <h2 style={styles.title}>Admin Login 🔐</h2>

          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              value={username}
              onChange={(e)=>setUsername(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button onClick={onLogin} style={styles.loginBtn}>
            Login ✅
          </button>

          

        </div>

      </div>

    </div>

  );

}

const styles = {

  page:{
    minHeight:"100vh",
    background:"#f8fafc",
    display:"flex",
    flexDirection:"column"
  },

  header:{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    padding:"16px 28px",
    background:"#fff",
    borderBottom:"1px solid #e5e7eb"
  },

  brand:{
    fontSize:22,
    fontWeight:900,
    color:"#111827"
  },

  homeBtn:{
    textDecoration:"none",
    border:"1px solid #e5e7eb",
    padding:"10px 14px",
    borderRadius:12,
    fontWeight:800,
    color:"#111827",
    background:"#fff"
  },

  center:{
    flex:1,
    display:"grid",
    placeItems:"center"
  },

  card:{
    width:"min(420px,92%)",
    background:"#fff",
    borderRadius:18,
    border:"1px solid #e5e7eb",
    padding:18,
    boxShadow:"0 6px 18px rgba(0,0,0,0.06)"
  },

  title:{
    margin:0,
    fontWeight:900
  },

  field:{
    marginTop:12,
    display:"grid",
    gap:6
  },

  label:{
    fontWeight:800
  },

  input:{
    padding:"10px 12px",
    borderRadius:12,
    border:"1px solid #e5e7eb",
    outline:"none"
  },

  loginBtn:{
    marginTop:14,
    width:"100%",
    padding:"10px 12px",
    borderRadius:12,
    border:"1px solid #111827",
    background:"#111827",
    color:"#fff",
    fontWeight:900,
    cursor:"pointer"
  },

  hint:{
    marginTop:10,
    fontWeight:700,
    color:"#6b7280"
  }

};
