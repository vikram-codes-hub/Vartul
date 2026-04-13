let ioInstance = null;
export const setIO = (io) => { ioInstance = io; };
export const getIO = () => ioInstance;
export const UserSocketMap = {};