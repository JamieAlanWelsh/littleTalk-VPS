(() => {
    const STORAGE_KEY = "chatterdillo_cookie_consent";
    const consentRoot = document.getElementById("cookie-consent");

    if (!consentRoot) {
        return;
    }

    const settingsLinks = document.querySelectorAll("[data-cookie-settings]");
    const preferences = document.getElementById("cookie-preferences");
    const analyticsCheckbox = consentRoot.querySelector("[data-consent-analytics]");
    const customiseButton = consentRoot.querySelector('[data-consent-action="customise"]');
    const measurementId = consentRoot.dataset.measurementId;
    const policyVersion = consentRoot.dataset.policyVersion;
    let analyticsLoaded = false;

    const readPreference = () => {
        try {
            const preference = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
            return preference && preference.version === policyVersion ? preference : null;
        } catch {
            return null;
        }
    };

    const writePreference = (analytics) => {
        const preference = {
            analytics,
            version: policyVersion,
            updatedAt: new Date().toISOString(),
        };
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
        } catch {
            // Apply the choice for this page even when browser storage is unavailable.
        }
        return preference;
    };

    const expireCookie = (name, domain) => {
        const domainPart = domain ? `; Domain=${domain}` : "";
        document.cookie = `${name}=; Max-Age=0; Path=/${domainPart}; SameSite=Lax`;
    };

    const removeAnalyticsCookies = () => {
        const hostnameParts = window.location.hostname.split(".");
        const domains = ["", window.location.hostname];

        if (hostnameParts.length > 1) {
            domains.push(`.${hostnameParts.slice(-2).join(".")}`);
        }

        document.cookie.split(";").forEach((cookie) => {
            const name = cookie.split("=")[0].trim();
            if (name === "_ga" || name.startsWith("_ga_")) {
                domains.forEach((domain) => expireCookie(name, domain));
            }
        });
    };

    const loadAnalytics = () => {
        if (analyticsLoaded || !measurementId) {
            return;
        }

        analyticsLoaded = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
            window.dataLayer.push(arguments);
        };
        window.gtag("js", new Date());
        window.gtag("config", measurementId, { anonymize_ip: true });

        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.google` + `tagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        document.head.appendChild(script);
    };

    const closeConsent = () => {
        consentRoot.hidden = true;
        preferences.hidden = true;
        customiseButton.setAttribute("aria-expanded", "false");
    };

    const applyPreference = (preference) => {
        analyticsCheckbox.checked = preference.analytics;
        if (preference.analytics) {
            loadAnalytics();
        } else {
            removeAnalyticsCookies();
        }
        closeConsent();
    };

    const savePreference = (analytics) => {
        applyPreference(writePreference(analytics));
    };

    consentRoot.addEventListener("click", (event) => {
        const action = event.target.closest("[data-consent-action]")?.dataset.consentAction;

        if (action === "accept") {
            savePreference(true);
        } else if (action === "reject") {
            savePreference(false);
        } else if (action === "customise") {
            preferences.hidden = !preferences.hidden;
            customiseButton.setAttribute("aria-expanded", String(!preferences.hidden));
        } else if (action === "save") {
            savePreference(analyticsCheckbox.checked);
        }
    });

    settingsLinks.forEach((settingsLink) => {
        settingsLink.addEventListener("click", (event) => {
            event.preventDefault();
            const preference = readPreference();
            analyticsCheckbox.checked = Boolean(preference?.analytics);
            consentRoot.hidden = false;
            consentRoot.querySelector(".cookie-consent__panel").focus();
        });
    });

    const preference = readPreference();
    if (preference) {
        applyPreference(preference);
    } else {
        consentRoot.hidden = false;
    }
})();
