export type ContextName = "TattoContext_3<TatooContext3>" | "TattoContext_1<TatooContext1>"
export const IsContext = (contextName: ContextName) => {
    return window.tattoContext.name === contextName;
}