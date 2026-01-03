"use client";

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import React from "react";
import useAuth from "@/hooks/useAuth"; // adjust path if needed

const API_BASE_URL = "http://localhost:5050/api/v1";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

type FailedQueueItem = {
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
};

const createInstance = (withCredentials = false): AxiosInstance => {
    return axios.create({
        baseURL: API_BASE_URL,
        withCredentials,
        headers: { "Content-Type": "application/json" },
    });
}

export const useAxios = (): AxiosInstance => {
    const { token, setToken, logout } = useAuth();

    let myToken = token; // to capture latest token in closures

    // Create once (DON'T recreate on token change)
    const axiosInstance = React.useMemo(() => {
        return createInstance();
    }, []);

    // Separate client for refresh (avoids interceptor loop)
    const refreshClient = React.useMemo(() => {
        return createInstance(true);
    }, []);

    const isRefreshingRef = React.useRef(false);
    const failedQueueRef = React.useRef<FailedQueueItem[]>([]);

    const processQueue = (error: unknown, newToken: string | null) => {
        failedQueueRef.current.forEach(({ resolve, reject }) => {
            if (newToken) resolve(newToken);
            else reject(error);
        });
        failedQueueRef.current = [];
    };

    React.useEffect(() => {
        // 1) Attach access token on every request (always latest)
        const reqInterceptor = axiosInstance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                if (myToken) config.headers.Authorization = `Bearer ${myToken}`;
                else delete (config.headers as Record<string, unknown>)["Authorization"];
                return config;
            },
            (error) => Promise.reject(error)
        );

        // 2) Refresh on 401 then retry original request
        const resInterceptor = axiosInstance.interceptors.response.use(
            (res) => res,
            async (error: AxiosError) => {
                const originalRequest = error.config as RetryableRequestConfig | undefined;

                const status = error.response?.status;
                const url = originalRequest?.url || "";

                // don't refresh on refresh endpoint itself
                const isRefreshCall = url.includes("/auth/refresh");

                if (status === 401 && originalRequest && !originalRequest._retry && !isRefreshCall) {
                    originalRequest._retry = true;

                    // If refresh already happening, queue this request
                    if (isRefreshingRef.current) {
                        return new Promise((resolve, reject) => {
                            failedQueueRef.current.push({
                                resolve: (newToken) => {
                                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                    resolve(axiosInstance(originalRequest));
                                },
                                reject,
                            });
                        });
                    }

                    isRefreshingRef.current = true;

                    try {
                        // refresh token is in httpOnly cookie; body can be empty
                        const refreshRes = await refreshClient.post("/auth/refresh", {});
                        const newAccessToken = (refreshRes.data as any)?.data?.accessToken;

                        if (!newAccessToken) throw new Error("No accessToken returned from /auth/refresh");
                        myToken = newAccessToken; // update local copy
                        setToken(newAccessToken);
                        processQueue(null, newAccessToken);

                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return axiosInstance(originalRequest);
                    } catch (refreshErr) {
                        processQueue(refreshErr, null);
                        await logout(); // clear state + server cookie (your logout does that)
                        return Promise.reject(refreshErr);
                    } finally {
                        isRefreshingRef.current = false;
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => {
            axiosInstance.interceptors.request.eject(reqInterceptor);
            axiosInstance.interceptors.response.eject(resInterceptor);
        };
    }, [axiosInstance, refreshClient, token, setToken, logout]);

    return axiosInstance;
};
