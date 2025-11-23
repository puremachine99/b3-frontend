/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateDeviceDto = {
    /**
     * Unique serial number used as the device identifier
     */
    serialNumber?: string;
    /**
     * Friendly name shown in the UI
     */
    name?: string;
    /**
     * Optional explanation of where or how the device is deployed
     */
    description?: string;
    /**
     * Free-form location text such as room name or coordinates label
     */
    location?: string;
    /**
     * Latitude component of the geo position
     */
    latitude?: number;
    /**
     * Longitude component of the geo position
     */
    longitude?: number;
    /**
     * Reported device connectivity status
     */
    status?: UpdateDeviceDto.status;
};
export namespace UpdateDeviceDto {
    /**
     * Reported device connectivity status
     */
    export enum status {
        ONLINE = 'ONLINE',
        OFFLINE = 'OFFLINE',
        RUNNING = 'RUNNING',
        IDLE = 'IDLE',
        ERROR = 'ERROR',
    }
}

