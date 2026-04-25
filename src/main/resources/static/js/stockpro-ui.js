document.addEventListener("DOMContentLoaded", function () {
    const shell = document.querySelector("[data-app-shell]");
    const toggleButton = document.querySelector("[data-sidebar-toggle]");
    const overlay = document.querySelector("[data-sidebar-close]");

    function closeSidebar() {
        if (shell) {
            shell.classList.remove("is-sidebar-open");
        }
    }

    if (toggleButton && shell) {
        toggleButton.addEventListener("click", function () {
            shell.classList.toggle("is-sidebar-open");
        });
    }

    if (overlay) {
        overlay.addEventListener("click", closeSidebar);
    }

    document.addEventListener("click", function (event) {
        document.querySelectorAll(".header-dropdown[open]").forEach(function (dropdown) {
            if (!dropdown.contains(event.target)) {
                dropdown.removeAttribute("open");
            }
        });
    });

    document.querySelectorAll("[data-dismiss-message]").forEach(function (button) {
        button.addEventListener("click", function () {
            const banner = button.closest(".message-banner");
            if (banner) {
                banner.remove();
            }
        });
    });

    document.querySelectorAll("form[data-auto-submit]").forEach(function (form) {
        form.querySelectorAll("select, input[type='date'], input[type='search']").forEach(function (field) {
            field.addEventListener("change", function () {
                form.requestSubmit();
            });
        });
    });

    document.querySelectorAll("form").forEach(function (form) {
        form.addEventListener("submit", function (event) {
            const confirmText = form.getAttribute("data-confirm");
            if (confirmText && !window.confirm(confirmText)) {
                event.preventDefault();
                return;
            }

            if (!form.noValidate && typeof form.checkValidity === "function" && !form.checkValidity()) {
                event.preventDefault();
                form.classList.add("was-validated");
                return;
            }

            const loadingTarget = form.querySelector("[type='submit']");
            if (loadingTarget) {
                loadingTarget.disabled = true;
                loadingTarget.dataset.originalText = loadingTarget.innerHTML;
                const loadingText = loadingTarget.getAttribute("data-loading-text");
                if (loadingText) {
                    loadingTarget.innerHTML = "<span class=\"loading-spinner\"></span>" + loadingText;
                }
                loadingTarget.classList.add("is-loading");
            }
        });
    });

    document.querySelectorAll("[data-confirm]").forEach(function (element) {
        if (element.tagName === "FORM") {
            return;
        }
        element.addEventListener("click", function (event) {
            const confirmText = element.getAttribute("data-confirm");
            if (confirmText && !window.confirm(confirmText)) {
                event.preventDefault();
            }
        });
    });

    document.querySelectorAll("[data-alert-action]").forEach(function (button) {
        button.addEventListener("click", function () {
            const url = button.getAttribute("data-url");
            if (!url) {
                return;
            }

            const csrfToken = document.querySelector("meta[name='_csrf']");
            const csrfHeader = document.querySelector("meta[name='_csrf_header']");
            const headers = {
                "X-Requested-With": "XMLHttpRequest"
            };

            if (csrfToken && csrfHeader) {
                headers[csrfHeader.content] = csrfToken.content;
            }

            button.disabled = true;
            fetch(url, {
                method: "POST",
                headers: headers,
                credentials: "same-origin"
            }).then(function (response) {
                if (!response.ok) {
                    throw new Error("Request failed");
                }
                const alertCard = button.closest(".alert-card, .header-alert");
                if (alertCard) {
                    alertCard.classList.remove("is-unread");
                }
                button.remove();
            }).catch(function () {
                button.disabled = false;
                const alertCenterLink = document.querySelector("[data-alert-center-link]");
                if (alertCenterLink) {
                    window.location.href = alertCenterLink.getAttribute("href");
                    return;
                }
                window.location.reload();
            });
        });
    });
});
