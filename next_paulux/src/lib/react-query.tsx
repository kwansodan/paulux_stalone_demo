'use client'

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

let browserClient: QueryClient | undefined = undefined;

function makeQueryClient(){
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
            }
        }
    })
}

function getQueryClient(){
    if(isServer){
        return makeQueryClient();
    }else{
        if(!browserClient)  browserClient = makeQueryClient()

        return browserClient;
    }
}

interface ReactQueryProviderProps {
    children: React.ReactNode
}

const ReactQueryProvider:React.FC<ReactQueryProviderProps> = ({ children }) => {
    const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient} >
        {children}
    </QueryClientProvider>
  )
}

export default ReactQueryProvider
