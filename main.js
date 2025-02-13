

let localStream;
let remoteStream;
let peerConnection;
let socket = new WebSocket("https://edb0-175-157-141-138.ngrok-free.app"); 

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

let init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
    document.getElementById('user-1').srcObject = localStream;

    createOffer();
}

let createOffer = async () => {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();

    document.getElementById('user-2').srcObject = remoteStream;

    //add local stream to peer connection

    localStream.getTracks().forEach(track=> {
        peerConnection.addTrack(track, localStream);
    })

    // get remote stream from peer connection
    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
        })
    }

    peerConnection.onicecandidate = (event) => {
        if(event.candidate){
            console.log('New Ice Candidate:', event.candidate);
            socket.send(JSON.stringify({type: 'ice-candidate', candidate: event.candidate}));
        }
    }

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    console.log('Offer:', offer);
    socket.send(JSON.stringify({ type: 'offer', offer }));

}

// Create an answer
let createAnswer = async (offer) => {
    console.log('create answer offer:', offer);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    console.log('Answer:', answer);

    socket.send(JSON.stringify({ type: 'answer', answer }));
};

// Handle incoming messages from the signaling server
socket.onmessage = async (event) => {
    let message = JSON.parse(event.data);

    if (message.type === 'offer') {
        console.log('Received offer========================:', message.offer);
        createAnswer(message.offer);
    } else if (message.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
    } else if (message.type === 'ice-candidate' && message.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
};

init();