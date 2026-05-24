declare const _default: {
    content: string[];
    theme: {
        extend: {
            colors: {
                background: string;
                foreground: string;
                border: string;
                input: string;
                ring: string;
                cosmic: {
                    950: string;
                    900: string;
                    800: string;
                    700: string;
                    600: string;
                    500: string;
                };
                gold: {
                    300: string;
                    400: string;
                    500: string;
                };
                nebula: {
                    400: string;
                    500: string;
                    600: string;
                };
                planet: {
                    sun: string;
                    moon: string;
                    mars: string;
                    mercury: string;
                    jupiter: string;
                    venus: string;
                    saturn: string;
                    rahu: string;
                    ketu: string;
                };
            };
            fontFamily: {
                sans: [string, string];
                display: [string, string];
            };
            backgroundImage: {
                'cosmic-gradient': string;
                'gold-gradient': string;
                'nebula-gradient': string;
            };
            boxShadow: {
                glass: string;
                'glow-red': string;
                'glow-gold': string;
            };
            animation: {
                float: string;
                shimmer: string;
                glowPulse: string;
            };
            keyframes: {
                float: {
                    '0%, 100%': {
                        transform: string;
                    };
                    '50%': {
                        transform: string;
                    };
                };
                shimmer: {
                    '0%': {
                        backgroundPosition: string;
                    };
                    '100%': {
                        backgroundPosition: string;
                    };
                };
                glowPulse: {
                    '0%, 100%': {
                        opacity: string;
                    };
                    '50%': {
                        opacity: string;
                    };
                };
            };
        };
    };
    plugins: any[];
};
export default _default;