/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DeviceLogsService {
    /**
     * List telemetry/command logs for a particular device
     * @param deviceId Device identifier
     * @returns any Chronological logs ordered from newest to oldest
     * @throws ApiError
     */
    public static deviceLogsControllerGetDeviceLogs(
        deviceId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/device-logs/{deviceId}',
            path: {
                'deviceId': deviceId,
            },
        });
    }
}
