import img1 from './profile_alison.png'
import img2 from './profile_richard.png'
import img3 from './profile_martin.png'
import img4 from './profile_marco.png'
import img5 from './profile_enrique.png'

export const dummyStories = [
  {
    id: 1,
    username: "Vikram Singh",
    image: img2,
  },
  {
    id: 8,
    username: "Vikram Singh",
    image: img2,
  },
  {
    id: 2,
    username: "Ritik",
    image: img1,
  },
  {
    id: 3,
    username: "Iyer",
    image: img3,
  },
  {
    id: 4,
    username: "Aryan",
    image: img4,
  },
  {
    id: 5,
    username: "Cool_boy Ritik",
    image: img5,
  },
  {
    id: 6,
    username: "Cool_boy Ritik",
    image: img5,
  },
  {
    id: 7,
    username: "Cool_boy Ritik",
    image: img5,
  },
]

// Dummy data for posts
export const dummyPosts = [
  {
    id: 1,
    username: "john_doe",
    profile: img1,
    postImage: img2,
    likes: "12,340",
    caption: "Chilling with friends 😎🍻 #weekendvibes",
  },
  {
    id: 2,
    username: "emma_w",
    profile: img3,
    postImage: img4,
    likes: "8,921",
    caption: "Exploring the city lights ✨🌃 #nightout",
  },
  {
    id: 3,
    username: "michael_b",
    profile: img5,
    postImage: img3,
    likes: "15,102",
    caption: "Always stay focused 💪 #grindmode",
  },
  {
    id: 4,
    username: "sophia_r",
    profile: img4,
    postImage: img1,
    likes: "21,567",
    caption: "Sunsets are proof that endings can be beautiful 🌅",
  },
  {
    id: 5,
    username: "alex99",
    profile: img2,
    postImage: img5,
    likes: "5,678",
    caption: "Good vibes only ✌️💯",
  },
]



// Dummy data for suggested users
export const dummySuggested = [
  {
    id: 1,
    username: "techguru.hub",
    profile: img1,
    note: "Followed by coder.ashish",
  },
  {
    id: 2,
    username: "travel_with_me",
    profile: img2,
    note: "Followed by wanderer.kriti",
  },
  {
    id: 3,
    username: "foodiez.delight",
    profile: img3,
    note: "Followed by yummy.tales",
  },
  {
    id: 4,
    username: "fitness_freak23",
    profile: img4,
    note: "Suggested for you",
  },
  {
    id: 5,
    username: "artistic.soul",
    profile: img5,
    note: "Followed by creative_riya",
  },
];



//dummy data for chats
export const dummyChats = [
  {
    id: 1,
    name: "Devansh Tiwari",
    profile: img1,
    lastMessage: "Devansh sent an attachment.",
    time: "21m",
    unread: true,
    isAttachment: true,
  },
  {
    id: 2,
    name: "Hritik Raj",
    profile: img2,
    lastMessage: "Hritik sent an attachment.",
    time: "1h",
    unread: true,
    isAttachment: true,
  },
  {
    id: 3,
    name: "Piyush",
    profile: img3,
    lastMessage: "Isko kabhi dekha?",
    time: "5h",
    unread: true,
    isAttachment: false,
  },
  {
    id: 4,
    name: "ammy singh",
    profile: img4,
    lastMessage: "ਭੁਟਟਮ sent an attachment.",
    time: "9h",
    unread: true,
    isAttachment: true,
  },
  {
    id: 5,
    name: "Manya",
    profile: img5,
    lastMessage: "Veer sent an attachment.",
    time: "1d",
    unread: true,
    isAttachment: true,
  },
  {
    id: 6,
    name: "Aryan Gupta",
    profile: img1,
    lastMessage: "Reacted 😂 to your message",
    time: "2d",
    unread: false,
    isAttachment: false,
  },
];



export const messages = [
  {
    id: 1,
    chatId: "chat1",
    sender: {
      id: "u101",
      name: "Alison",
      avatar: img1,
    },
    text: "Hey! Did you check out the new reel?",
    timestamp: "2025-10-03T14:25:00Z",
    isMe: false, // message from other user
  },
  {
    id: 2,
    chatId: "chat1",
    sender: {
      id: "me",
      name: "Me",
      avatar:img2,
    },
    text: "Yeah, just watched it 🔥 really cool!",
    timestamp: "2025-10-03T14:26:10Z",
    isMe: true, // my message
  },
  {
    id: 3,
    chatId: "chat1",
    sender: {
      id: "u101",
      name: "Alison",
      avatar: img3,
    },
    text: "Did you stake tokens on it?",
    timestamp: "2025-10-03T14:27:20Z",
    isMe: false,
  },
  {
    id: 4,
    chatId: "chat1",
    sender: {
      id: "me",
      name: "Me",
      avatar: img4
    },
    text: "Yes, I staked 50 tokens 🚀",
    timestamp: "2025-10-03T14:28:00Z",
    isMe: true,
  },
];
