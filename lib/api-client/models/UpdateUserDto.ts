/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateUserDto = {
    /**
     * Name displayed to the rest of the team
     */
    username?: string;
    /**
     * Unique login email
     */
    email?: string;
    /**
     * Password for the created user
     */
    password?: string;
    /**
     * Role to assign, default OPERATOR
     */
    role?: UpdateUserDto.role;
};
export namespace UpdateUserDto {
    /**
     * Role to assign, default OPERATOR
     */
    export enum role {
        ADMIN = 'ADMIN',
        OPERATOR = 'OPERATOR',
        VIEWER = 'VIEWER',
    }
}

