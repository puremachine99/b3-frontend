/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateGroupDto } from '../models/CreateGroupDto';
import type { UpdateGroupDto } from '../models/UpdateGroupDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GroupsService {
    /**
     * Create a device group
     * @param requestBody
     * @returns any Newly created group payload
     * @throws ApiError
     */
    public static groupsControllerCreate(
        requestBody: CreateGroupDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List all groups
     * @returns any Array of groups from database
     * @throws ApiError
     */
    public static groupsControllerFindAll(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups',
        });
    }
    /**
     * Get group details
     * @param id Group identifier
     * @returns any Group data
     * @throws ApiError
     */
    public static groupsControllerFindOne(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update group information
     * @param id Group identifier
     * @param requestBody
     * @returns any Updated group data
     * @throws ApiError
     */
    public static groupsControllerUpdate(
        id: string,
        requestBody: UpdateGroupDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/groups/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Remove a group
     * @param id Group identifier
     * @returns any Deletion acknowledgement
     * @throws ApiError
     */
    public static groupsControllerRemove(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/groups/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Attach a device to a group
     * @param id Group identifier
     * @param deviceId Device ID (use database id, not serial)
     * @returns any Result of the association
     * @throws ApiError
     */
    public static groupsControllerAddDevice(
        id: string,
        deviceId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups/{id}/devices/{deviceId}',
            path: {
                'id': id,
                'deviceId': deviceId,
            },
        });
    }
    /**
     * Detach a device from a group
     * @param id Group identifier
     * @param deviceId Device ID (use database id, not serial)
     * @returns any Result of the disassociation
     * @throws ApiError
     */
    public static groupsControllerRemoveDevice(
        id: string,
        deviceId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/groups/{id}/devices/{deviceId}',
            path: {
                'id': id,
                'deviceId': deviceId,
            },
        });
    }
    /**
     * List devices inside a group
     * @param id Group identifier
     * @returns any Device array belonging to the group
     * @throws ApiError
     */
    public static groupsControllerListDevices(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups/{id}/devices',
            path: {
                'id': id,
            },
        });
    }
}
