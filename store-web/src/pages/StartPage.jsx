import React from "react";
import { useNavigate } from "react-router-dom";

const StartPage = () => {
    const navigate = useNavigate();

    return (
    // 화면 아무 곳이나 누르면 로그인 페이지로 이동
    <div style={styles.container} onClick={() => navigate('/login')}>
        <div style={styles.content}>
        <h1 style ={{fontSize: '4rem', marginBottom: '20px'}}>🏪 안녕하세요!</h1>
        <p style={{fontSize:'1.5rem', opacity: 0.8}}>화면을 터치하여 시작하세요</p>
        </div>
    </div>
 );
};

const styles = {
    container:{
        height:'100%',
        width:'100%',
        backgroundColor:'#2c3e50',
        display: 'flex',
        justifyContent:'center',
        alignItems:'center',
        color:'white',
        cursor:'pointer'
    },
    content:{textAlign:'center'}
};

export default StartPage;