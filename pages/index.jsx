import Head from "next/head";
import { io } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import shortUUID from "short-uuid";
import { useDoubleTap } from "use-double-tap";

export default function Home() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [inCall, setInCall] = useState(false);
  const [allRooms, setAllRooms] = useState([]);
  const [userId, setUserId] = useState("");
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);

  const pick = useRef(null);
  const bind = useDoubleTap((e) => {
    pick.current.click();
  });

  useEffect(() => {
    const socketIo = io("https://just-cyan-peacock.glitch.me");
    setUserId(socketIo.id);
    setSocket(socketIo);
  }, []);

  useEffect(() => {
    socket?.on("rooms", (args) => {
      // console.log(args);
      setAllRooms(args);
    });
  }, [socket]);

  // socket?.on("receiveImage", (data) => {
  //   console.log(messages);
  //   setMessages([...messages, data]);
  // });

  const leaveRoom = () => {
    setName("");
    setRoomId("");
    setMessages([]);
    socket.emit("leaveRoom", roomId, socket.id);
    setInCall(false);
  };

  const createRoom = () => {
    if (name === "") {
      alert("Fill in name field");
    } else {
      const id = shortUUID().generate();
      socket?.emit("createRoom", id, name);
      setRoomId(id);
      socket?.on("connectToRoom", (args) => {
        // console.log(args);
      });
      setInCall(true);
    }
  };

  const joinRoom = () => {
    console.log(allRooms);
    if (name === "" || roomId === "") {
      alert("Fill in all fields");
    } else {
      socket?.emit("checkRoomExists", roomId, (exists) => {
        if (exists) {
          socket?.emit("joinRoom", roomId, name);
          setInCall(true);
        } else {
          alert("Room does not exist");
        }
      });
    }
  };

  const handlePick = (e) => {
    if (e) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.addEventListener("load", async () => {
        socket?.emit("sendImage", {
          sender: name,
          data: reader.result,
          roomId: roomId,
        });
        // messages.push({ sender: "You", data: reader.result });
        // setMessages([...messages, { sender: "You", data: reader.result }]);
      });
    }
  };
  return (
    <>
      <Head>
        <title>PyAudio</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      {!inCall ? (
        <section
          style={{ height: "90vh" }}
          className="flex flex-col w-full justify-center items-center "
        >
          <div className="mx-auto my-0 text-center px-10">
            <h1 className="text-3xl h-fit font-bold">PyShare</h1>
            <p className="opacity-40">Create or Join an Image Sharing room</p>
            <input
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Name"
              type="text"
              className="w-full text-sm mt-5 p-2 px-3 rounded outline-0 bg-white/[.06] focus:border-2 border-indigo-500 bg-grey-500"
            />
            <input
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID (ignore if creating room)"
              type="text"
              className="w-full bg-white/[.06] text-sm mt-3 p-2 px-3 rounded outline-0 focus:border-2 border-indigo-500"
            />
          </div>
          <div className="flex flex-row items-center pt-5">
            <button
              onClick={() => createRoom()}
              className="rounded text-sm bg-indigo-500 px-3 py-2 mr-2"
            >
              Create Room
            </button>
            <button
              onClick={() => joinRoom()}
              className="rounded text-sm bg-indigo-500 px-3 py-2"
            >
              Join Room
            </button>
          </div>
        </section>
      ) : (
        <section {...bind} className="p-5 h-screen">
          <div className="flex flex-col items-center justify-center">
            <p
              className="bg-white/[0.1] w-fit opacity-[.8] p-3 py-2 rounded mb-1"
              onClick={async () => {
                await navigator.clipboard.writeText(roomId);
                alert(`Copied ID: ${roomId} to clipboard`);
              }}
              style={{ cursor: "pointer" }}
            >
              Room ID: {roomId}
            </p>
            <p className="text-sm opacity-[.5]">Click on ID to copy</p>
          </div>
          <input
            ref={pick}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => handlePick(e)}
            accept="image/*"
          />
          <div className="pb-5" style={{ padding: "20px", paddingBottom:"5rem" }}>
            {allRooms?.filter((room) => room.roomId === roomId)[0]?.messages
              ?.length === 0 ? (
              <p className="flex flex-col items-center justify-center" style={{width:"100%", height:"70vh"}}><span>No images shared yet</span><span style={{fontSize:"12px", opacity:0.5}}>Double tap on screen to send image</span></p>
            ) : (
              <>
                {allRooms
                  ?.filter((room) => room.roomId === roomId)[0]
                  ?.messages?.map((message, index) => {
                    return (
                      <div
                        
                        key={index}
                        style={{ maxWidth: "700px", margin: "0 auto",borderBottom:"0.7px solid rgba(255,255,255,0.1)", marginBottom:"1.5rem" }}
                      >
                        <img
                          className="rounded-md"
                          style={{ width: "100%", height: "auto" }}
                          src={message?.data}
                          alt=""
                        />
                        <div className="flex flex-row justify-between items-center pt-3 pb-3">
                          <p style={{fontSize:"14px"}}><span style={{opacity:.6}}>From:</span> {" "}
                            {message?.sender === name ? "You" : message?.sender}
                          </p>
                          <a className="text-indigo-500" style={{fontSize:"14px"}} href={message?.data} download>Download</a>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>
          <div className="fixed bottom-0 left-0 w-full flex flex-row items-center justify-between p-3 ">
            <div className="flex flex-row justify-start max-w-xl overflow-x-scroll mr-3">
              {allRooms
                ?.filter((room) => room.roomId === roomId)[0]
                ?.users?.map((user, index) => {
                  return (
                    <p
                      style={{ background: "#252525" }}
                      className="w-fit p-3 py-1.5 mr-1.5 rounded mb-1"
                      key={index}
                    >
                      {user?.name}
                    </p>
                  );
                })}
            </div>

            <button
              className="rounded text-sm bg-indigo-500 px-3 py-2"
              onClick={() => leaveRoom()}
            >
              Leave Room
            </button>
          </div>
        </section>
      )}
    </>
  );
}
