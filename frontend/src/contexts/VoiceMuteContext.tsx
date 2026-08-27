import { createContext, useContext } from "react";

const VoiceMuteContext = createContext<boolean>(false);

export const VoiceMuteProvider = VoiceMuteContext.Provider;

// Whether AI voice playback (prompts, word/option speech) should be silenced.
export const useVoiceMuted = (): boolean => useContext(VoiceMuteContext);

export default VoiceMuteContext;
