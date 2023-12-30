import React from  'react';
import { useCallback } from 'react';
import { useState ,useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import {useSocket} from '../context/SocketProvider';

const LobbyScreen = () => {
    const[email,setEmail]=useState("");
    const[room,setRoom]=useState("");

    const socket=useSocket()
    // console.log(socket);
    const navigate=useNavigate();

    const handleSubmitForm = useCallback((e) => {
        e.preventDefault();
        socket.emit("room:join",{email,room}); {/*so that it would not get submit empty */}
        console.log({email,room});
    },
    [email,room,socket]
    );

    const handleJoinRoom = useCallback((data) => {
        const{email,room}=data;
        // console.log(email,room);
        navigate(`/room/${room}`);
    },[navigate]);

    // useEffect(() => {
    //     socket.on("room:join",(data) => {
    //         console.log(`Data from backend ${data}`);
    //     });
    // }, [socket]);
    useEffect(() => {
        socket.on("room:join", handleJoinRoom);
        return()=> {
            socket.off('room:join',handleJoinRoom)
        }
    }, [socket,handleJoinRoom]);

    return(
        <div>
            <h1>Lobby</h1>
            <form onSubmit={handleSubmitForm}>
                {/*this label is particularly for this input*/}
                <label htmlFor="email">Email ID</label>
                <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
                <br/>
                <label htmlFor="room">Room No</label>
                <input 
                type="text" 
                id="room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                />
                <br/>
                <button>Join</button>
            </form>
        </div>
    );
};
export default LobbyScreen;