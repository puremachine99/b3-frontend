/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RegisterDto = {
    /**
     * Name that will be shown to other users
     */
    username: string;
    /**
     * Unique email that will be used to login
     */
    email: string;
    /**
     * Password with minimum 6 characters
     */
    password: string;
    /**
     * Role assigned to the user, defaults to OPERATOR when omitted
     */
    role?: RegisterDto.role;
};
export namespace RegisterDto {
    /**
     * Role assigned to the user, defaults to OPERATOR when omitted
     */
    export enum role {
        ADMIN = 'ADMIN',
        OPERATOR = 'OPERATOR',
        VIEWER = 'VIEWER',
    }
}

