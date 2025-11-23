/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateDeviceDto } from '../models/CreateDeviceDto';
import type { UpdateDeviceDto } from '../models/UpdateDeviceDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DevicesService {
    /**
     * List all registered devices
     * @returns any Array of devices returned from the database
     * @throws ApiError
     */
    public static devicesControllerFindAll(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/devices',
        });
    }
    /**
     * Register a new device
     * @param requestBody
     * @returns any Device successfully created
     * @throws ApiError
     */
    public static devicesControllerCreate(
        requestBody: CreateDeviceDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/devices',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get a single device by ID
     * @param id Device identifier from database
     * @returns any Device data when found
     * @throws ApiError
     */
    public static devicesControllerFindOne(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/devices/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update device information
     * @param id Device identifier from database
     * @param requestBody
     * @returns any Updated device payload
     * @throws ApiError
     */
    public static devicesControllerUpdate(
        id: string,
        requestBody: UpdateDeviceDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/devices/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a device permanently
     * @param id Device identifier from database
     * @returns any Deletion acknowledgement
     * @throws ApiError
     */
    public static devicesControllerRemove(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/devices/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Retrieve last known connectivity status of a device
     * @param id Device identifier from database
     * @returns any Status value based on logs or MQTT presence
     * @throws ApiError
     */
    public static devicesControllerFindStatus(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/devices/{id}/status',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Relay a command to a device topic
     * @param serialNumber Hardware serial number used as MQTT topic suffix
     * @param requestBody Provide either { payload }, { command }, or a raw string body to be sent to MQTT
     * @returns any Command queued to MQTT broker
     * @throws ApiError
     */
    public static devicesControllerSendCommand(
        serialNumber: string,
        requestBody: ({
            payload?: Record<string, any>;
        } | {
            command?: string;
        } | string),
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/devices/{serialNumber}/cmd',
            path: {
                'serialNumber': serialNumber,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
