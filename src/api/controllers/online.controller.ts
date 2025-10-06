import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '@shared/types/service.types';
import { SocketService } from '@shared/infra/socket/socket.service';

@injectable()
export class OnlineController {
    constructor(
        @inject(TYPES.SocketService) private socketService: SocketService
    ) { }

    // GET /api/online/users - Get online users count
    getOnlineUsersCount = async (req: Request, res: Response) => {
        try {
            const count = this.socketService.getConnectedUsersCount();

            res.json({
                success: true,
                data: {
                    onlineUsersCount: count
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get online users count',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    // GET /api/online/users/list - Get basic socket connection info
    getOnlineUsersList = async (req: Request, res: Response) => {
        try {
            const count = this.socketService.getConnectedUsersCount();

            res.json({
                success: true,
                data: {
                    message: 'Socket.IO connection status',
                    connectedUsersCount: count,
                    note: 'Detailed user list not available in current implementation'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get online users list',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    // GET /api/online/users/detail - Get Socket.IO connection status
    getOnlineUsersDetail = async (req: Request, res: Response) => {
        try {
            const count = this.socketService.getConnectedUsersCount();

            res.json({
                success: true,
                data: {
                    socketConnections: count,
                    timestamp: new Date().toISOString(),
                    status: 'Socket.IO service is running'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get online users detail',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    // GET /api/online/users/:userId/status - Basic user status check
    getUserOnlineStatus = async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;

            res.json({
                success: true,
                data: {
                    userId,
                    message: 'User status check not implemented',
                    note: 'Individual user tracking not available in current implementation'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to check user online status',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    // GET /api/online/rooms - Get Socket.IO service status
    getActiveRooms = async (req: Request, res: Response) => {
        try {
            const count = this.socketService.getConnectedUsersCount();

            res.json({
                success: true,
                data: {
                    connectedSockets: count,
                    timestamp: new Date().toISOString(),
                    message: 'Socket.IO service is active',
                    note: 'Room statistics not available in current implementation'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get active rooms',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}