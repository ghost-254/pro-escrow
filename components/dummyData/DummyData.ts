// Dummy data for the escrow platform

export const folders = [
  {
    folderId: '1',
    type: 'Buy',
    members: { count: 3 }, // Number of members in the folder
    chats: [
      {
        chatId: 'chat1',
        title: 'Buying Chat Home Base, Text Factory and Screening',
        amount: 1000.0,
        currency: 'USD',
        startTime: '2024-01-10',
        endTime: '2024-01-15',
        status: 'Pending Release',
        color: '#FFA500', // Orange for ongoing tasks
      },
    ],
  },
  {
    folderId: '2',
    type: 'Sell',
    members: { count: 5 },
    chats: [
      {
        chatId: 'chat1',
        title: 'Website Development Chat',
        amount: 1000.0,
        currency: 'USD',
        startTime: '2024-01-10',
        endTime: '2024-01-15',
        status: 'In Progress',
        color: '#FFA500', // Orange for ongoing tasks
      },
    ],
  },
  {
    folderId: '3',
    type: 'Sell',
    members: { count: 2 },
    chats: [
      {
        chatId: 'chat2',
        title: 'Graphic Design Chat',
        amount: 500.0,
        currency: 'USD',
        startTime: '2024-01-12T10:00:00Z',
        endTime: '2024-01-14T10:00:00Z',
        status: 'Completed',
        color: '#28A745', // Green for completed tasks
      },
    ],
  },
  {
    folderId: '4',
    type: 'Sell',
    members: { count: 1 },
    chats: [
      {
        chatId: 'chat3',
        title: 'Dispute: Mobile App Development',
        amount: 2000.0,
        currency: 'USD',
        startTime: '2024-01-15T08:00:00Z',
        endTime: '2024-01-20T08:00:00Z',
        status: 'Disputed',
        color: '#DC3545', // Red for disputes
      },
    ],
  },
]

export const chats = [
  {
    chatId: 'chat1',
    projectId: 'P001',
    title: 'Website Development Chat',
    amount: 1000000.0,
    currency: 'USD',
    timestamp: '2024-01-10',
    completionTime: '2024-01-15',
    countdown: '5 days left',
    participants: ['client1', 'freelancer1', 'escrowAgent1'],
    messages: [
      {
        senderId: 'client1',
        timestamp: '2024-01-10T14:32:00Z',
        message: 'Hi, please confirm if you received the project details.',
      },
      {
        senderId: 'freelancer1',
        timestamp: '2024-01-10T14:35:00Z',
        message: "Yes, I have received them. I'll start working soon.",
      },
      {
        senderId: 'escrowAgent1',
        timestamp: '2024-01-10T15:00:00Z',
        message: 'Escrow has been funded. Let us know if you need assistance.',
      },
    ],
  },
  {
    chatId: 'chat2',
    projectId: 'P002',
    title: 'Graphic Design Chat',
    amount: 500.0,
    currency: 'USD',
    timestamp: '2024-01-12T10:00:00Z',
    completionTime: '2024-01-14T10:00:00Z',
    countdown: '2 days left',
    participants: ['client2', 'freelancer2', 'escrowAgent1'],
    messages: [
      {
        senderId: 'freelancer2',
        timestamp: '2024-01-15T09:00:00Z',
        message: 'Here is the draft for the logo design.',
      },
      {
        senderId: 'client2',
        timestamp: '2024-01-15T10:00:00Z',
        message: 'Looks great! Can you make the background lighter?',
      },
      {
        senderId: 'freelancer2',
        timestamp: '2024-01-15T10:30:00Z',
        message: 'Sure, I’ll send the updated version shortly.',
      },
    ],
  },
  {
    chatId: 'chat3',
    projectId: 'P003',
    title: 'Dispute: Mobile App Development',
    amount: 2000.0,
    currency: 'USD',
    timestamp: '2024-01-15T08:00:00Z',
    completionTime: '2024-01-20T08:00:00Z',
    countdown: 'Disputed',
    participants: ['client3', 'freelancer3', 'escrowAgent2'],
    messages: [
      {
        senderId: 'client3',
        timestamp: '2024-01-20T12:00:00Z',
        message: 'The deliverables do not match the agreed requirements.',
      },
      {
        senderId: 'freelancer3',
        timestamp: '2024-01-20T12:15:00Z',
        message: 'I followed the project brief exactly as it was given.',
      },
      {
        senderId: 'escrowAgent2',
        timestamp: '2024-01-20T13:00:00Z',
        message: 'We will review the case and get back to both parties.',
      },
    ],
  },
]
