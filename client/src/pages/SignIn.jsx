import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function SignIn() {

  const nav = useNavigate();

  const [form,setForm] = useState({ email:"", password:"" });
  const [loading,setLoading] = useState(false);

  const redirect = useMemo(()=>{
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect");
  },[]);

  const onChange = (e)=>{
    setForm(p=>({...p,[e.target.name]:e.target.value}));
  };

  const onSubmit = async(e)=>{
    e.preventDefault();
    setLoading(true);

    try{

      const res = await fetch("http://localhost:5000/api/auth/login",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify(form)
      });

      const data = await res.json();

      if(!res.ok || !data.ok){
        alert(data.message || "Login failed");
        return;
      }

      localStorage.setItem("servespot_token",data.token);
      localStorage.setItem("servespot_user",JSON.stringify(data.user));

      if(redirect) nav(redirect);
      else nav(data.user.role==="provider" ? "/dashboard/provider" : "/dashboard/user");

    }catch{
      alert("Server not reachable");
    }finally{
      setLoading(false);
    }
  };

  return(

  <div style={styles.page}>

    <Navbar showSignup showSignin={false}/>

    <main style={styles.main}>

      <div style={styles.glassCard}>

        <h2 style={styles.title}>Welcome to ServeSpot</h2>

        <form onSubmit={onSubmit} style={styles.form}>

          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email"
            className="faang-input"
          />

          <input
            required
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="Password"
            className="faang-input"
          />

          <button className="faang-btn">

            {loading ? "Signing in..." : "Signin"}

          </button>

        </form>

      </div>

      <style>{`

      /* FAANG Card Entry */
      @keyframes cardEnter{
        from{ opacity:0; transform: translateY(12px) scale(.98); }
        to{ opacity:1; transform: translateY(0) scale(1); }
      }

      /* Inputs */
      .faang-input{
        padding:12px;
        border-radius:12px;
        border:1px solid #e5e7eb;
        transition: all .2s ease;
      }

      .faang-input:focus{
        border-color:#6366f1;
        box-shadow:0 0 0 4px rgba(99,102,241,0.15);
        outline:none;
      }

      /* Button */
      .faang-btn{
        margin-top:8px;
        padding:12px;
        border-radius:12px;
        border:none;
        background:#6366f1;
        color:white;
        font-weight:800;
        transition: all .18s ease;
        cursor:pointer;
      }

      .faang-btn:hover{
        transform: translateY(-1px);
        box-shadow:0 10px 22px rgba(0,0,0,0.12);
      }

      .faang-btn:active{
        transform: translateY(0px);
      }

      `}</style>

    </main>

  </div>

  );
}

const styles={

page:{
minHeight:"100vh",
background:"radial-gradient(circle at 20% 20%, rgba(99,102,241,0.08), transparent), #f8fafc"
},

main:{
display:"flex",
justifyContent:"center",
alignItems:"center",
padding:"60px"
},

glassCard:{
width:"420px",
padding:26,
borderRadius:20,
background:"rgba(255,255,255,0.7)",
backdropFilter:"blur(14px)",
animation:"cardEnter .45s ease"
},

title:{
textAlign:"center",
fontWeight:900
},

form:{
display:"grid",
gap:12,
marginTop:14
}

};
