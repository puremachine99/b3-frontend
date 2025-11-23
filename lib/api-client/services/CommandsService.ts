/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SendCommandDto } from '../models/SendCommandDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CommandsService {
    /**
     * Broadcast a command payload to a single device channel
     * @param id Device ID (not serial number)
     * @param requestBody
     * @returns any Command published to the device-specific topic
     * @throws ApiError
     */
    public static commandsControllerSendToDevice(
        id: string,
        requestBody: SendCommandDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/commands/device/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Publish a command payload to all devices in a group
     * @param id Group identifier
     * @param requestBody
     * @returns any Command published to the group topic
     * @throws ApiError
     */
    public static commandsControllerSendToGroup(
        id: string,
        requestBody: SendCommandDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/commands/group/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
