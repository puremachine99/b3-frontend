/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateGroupDto = {
    /**
     * Human friendly group name used to cluster devices
     */
    name: string;
    /**
     * Optional description that explains this device group
     */
    description?: string;
    /**
     * Arbitrary metadata (tags, thresholds, etc.) stored along the group
     */
    metadata?: Record<string, any>;
};

