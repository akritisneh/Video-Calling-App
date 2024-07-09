import React, {useState,useEffect,useCallback} from "react";
import './RoomPage.css';
import ReactPlayer from 'react-player'
import peer from "../service/peer";
import {useSocket} from "../context/SocketProvider";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faVideo } from '@fortawesome/free-solid-svg-icons';

const RoomPage= () => {
    const socket=useSocket();
    const [remoteSocketId,setRemoteSocketId]=useState(null);
    const [myStream,setMyStream] = useState();
    const [remoteStream,setRemoteStream] = useState();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);

    const toggleMute = () => {
        setIsMuted(prev => !prev);
        if (myStream) {
            myStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    };

    const toggleVideo = () => {
        setIsVideoOn(prev => !prev);
        if (myStream) {
            myStream.getVideoTracks().forEach(track => {
                track.enabled = !isVideoOn;
            });
        }
    };

    const toggleChat = () => {
        setIsChatOpen(prev => !prev);
    };

    const handleMessageChange = (event) => {
        setMessage(event.target.value);
    };

    const sendMessage = () => {
        if (message.trim() !== '') {
            setMessages(prevMessages => [...prevMessages, { content: message, from: 'me' }]);
            socket.emit('chat:message', { content: message, from: 'me' });
            setMessage('');
        }
    };

    const handleUserJoined=useCallback(({email,id}) => {
        console.log(`Email ${email} joined room`);
        setRemoteSocketId(id);
    }, []);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio:true,
            video:true,
        });
        const offer = await peer.getOffer();
        socket.emit("user:call",{to:remoteSocketId,offer});
        setMyStream(stream);
    },[remoteSocketId,socket]);

    const handleIncomingCall = useCallback(
        async({ from, offer }) => {
          setRemoteSocketId(from);
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          setMyStream(stream);
          console.log(`Incoming Call`, from, offer);
          const ans = await peer.getAnswer(offer);
          socket.emit("call:accepted", { to: from, ans });
        },
        [socket]
      );

    const sendStreams = useCallback(() => {
        for(const track of myStream.getTracks()){
            peer.peer.addTrack(track,myStream);
        }
    },[myStream]);

    const handleCallAccepted=useCallback(({from,ans}) => {
        peer.setLocalDescription(ans);
        console.log("Call Accepted!");
        sendStreams();
    },[sendStreams]);

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", {offer,to:remoteSocketId});
    },[remoteSocketId,socket]);

    useEffect(() => {
        peer.peer.addEventListener("negotiationneeded",handleNegoNeeded);
        return() => {
            peer.peer.removeEventListener("negotiationneeded",handleNegoNeeded);
        };
    },[handleNegoNeeded]);

    const handleNegoNeedIncoming = useCallback(async({from,offer}) => {
        const ans=await peer.getAnswer(offer);
        socket.emit("peer:nego:done",{to:from,ans});
    } , [socket])

    const handleNegoNeedFinal=useCallback(async({ans}) => {
        await peer.setLocalDescription(ans);
    },[])

    useEffect(() => {
        peer.peer.addEventListener('track',async ev => {
            const remoteStream= ev.streams;
            console.log("GOT TRACKS!!");
            setRemoteStream(remoteStream[0]);
        });
    }, []);

    useEffect(() => {
        socket.on("user:joined",handleUserJoined);
        socket.on("incoming:call",handleIncomingCall);
        socket.on("call:accepted",handleCallAccepted);
        socket.on("peer:nego:needed",handleNegoNeedIncoming);
        socket.on("peer:nego:final",handleNegoNeedFinal);
        return() => {
            socket.off('user:joined',handleUserJoined);
            socket.off('incoming:call',handleIncomingCall);
            socket.off('call:accepted',handleCallAccepted);
            socket.off("peer:nego:needed",handleNegoNeedIncoming);
            socket.off("peer:nego:final",handleNegoNeedFinal);

        }
    },[socket,handleUserJoined,handleIncomingCall,handleCallAccepted,handleNegoNeedIncoming,handleNegoNeedFinal]);

    return (
        <div className="room-container"> {/* Add a container with a class name */}
            <h1>RoomPage</h1>
            <h4>{remoteSocketId ? 'Connected' : 'No one in room'}</h4>
            {myStream && <button onClick={sendStreams}>Send Stream</button>}
            {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
            <div>
                {/* Mute/Unmute button */}
                <button onClick={toggleMute}>
                    
                    {isMuted ? 'Unmute' : 'Mute'}
                </button>
                {/* Toggle video button */}
                <button onClick={toggleVideo}>
                    {isVideoOn ? 'Turn Video Off' : 'Turn Video On'}
                </button>
                {/* Toggle chat button */}
                <button onClick={toggleChat}>
                    {isChatOpen ? 'Close Chat' : 'Open Chat'}
                </button>
            </div>
            {
                myStream && (
                    <>
                        <h1>My Stream</h1>
                        <ReactPlayer
                            playing
                            muted
                            height="300px"
                            width="300px"
                            url={myStream} />
                    </>
                )}
            {
                remoteStream && (
                    <>
                        <h1>Remote Stream</h1>
                        <ReactPlayer
                            playing
                            muted
                            height="300px"
                            width="300px"
                            url={remoteStream} />
                    </>
                )}
                {isChatOpen && (
                <div className="chat-box">
                    <ul>
                        {messages.map((msg, index) => (
                            <li key={index}>{msg.from}: {msg.content}</li>
                        ))}
                    </ul>
                    <input
                        type="text"
                        value={message}
                        onChange={handleMessageChange}
                        placeholder="Type your message..."
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            )}
        </div>
    )
}
export default RoomPage;