import { PusherMock } from 'pusher-js-mock';

const pusher = new PusherMock();

export const pusherChannel = pusher.subscribe('user-channel');
export const companyPusherChannel = pusher.subscribe('company-channel');

export const connectPusher = async () => ({ pusherChannel, companyPusherChannel });
