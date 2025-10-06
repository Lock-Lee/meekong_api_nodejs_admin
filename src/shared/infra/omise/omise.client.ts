import omise from "omise";

export type OmiseClient = ReturnType<typeof omise>;


export default function getOmiseClient(config?: {
    secretKey?: string;
    publicKey?: string;
}): OmiseClient {
    return omise({
        secretKey: config?.secretKey || process.env.OMISE_SECRET_KEY!,
        publicKey: config?.publicKey || process.env.OMISE_PUBLIC_KEY!,
    });
}
