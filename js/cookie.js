(function() {
    'use strict';

    // Configuration
    const config = {
      cookieName: 'cookieConsent',
      cookieValue: 'accepted',
      expiryDays: 365,
      message: 'This website uses cookies to improve your experience. Do you accept the use of cookies?',
      acceptButtonText: 'Accept',
      declineButtonText: 'Decline',
      linkText: 'Learn more',
      linkUrl: 'https://www.nextreason.com/privacy-policy', // Replace with your privacy policy URL
      theme: 'light', // 'light' or 'dark'
      position: 'bottom', // 'top' or 'bottom'
      autoOpen: true, // Set to false if you want to trigger it manually
      requireConsent: true, // Set to true to force user interaction
      transition: 'fade', // 'fade', 'slide', or 'none'
    };

    // Helper Functions
    const setCookie = (name, value, days) => {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = "expires=" + date.toUTCString();
      document.cookie = name + "=" + value + ";" + expires + ";path=/;SameSite=Lax";
    };

    const getCookie = (name) => {
      const cookieName = name + "=";
      const decodedCookie = decodeURIComponent(document.cookie);
      const ca = decodedCookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(cookieName) === 0) {
          return c.substring(cookieName.length, c.length);
        }
      }
      return null;
    };

    const createCookieBanner = () => {
      const banner = document.createElement('div');
      banner.id = 'cookie-banner';
      banner.style.position = 'fixed';
      banner.style.zIndex = '10000';
      banner.style.left = '0';
      banner.style.right = '0';
      banner.style.display = 'flex';
      banner.style.flexWrap = 'wrap';
      banner.style.justifyContent = 'center';
      banner.style.alignItems = 'center';
      banner.style.padding = '10px 20px';
      banner.style.boxSizing = 'border-box';
      banner.style.textAlign = 'center';
      banner.style.transition = config.transition === 'none' ? 'none' : `opacity 0.3s, transform 0.3s`;

      if (config.position === 'top') {
        banner.style.top = '0';
      } else {
        banner.style.bottom = '0';
      }

      if (config.theme === 'dark') {
        banner.style.backgroundColor = '#222';
        banner.style.color = '#eee';
      } else {
        banner.style.backgroundColor = '#f0f0f0';
        banner.style.color = '#333';
      }
      banner.style.width = '100%';

      const messageContainer = document.createElement('div');
      messageContainer.style.flex = '1 1 auto';
      messageContainer.style.padding = '5px';
      messageContainer.innerHTML = config.message;

      const link = document.createElement('a');
      link.href = config.linkUrl;
      link.textContent = config.linkText;
      link.style.color = config.theme === 'dark' ? '#4CAF50' : '#0078d7'; // Example link color
      link.style.textDecoration = 'underline';
      link.style.marginLeft = '10px';
      messageContainer.appendChild(link);

      const buttonContainer = document.createElement('div');
      buttonContainer.style.flex = '0 0 auto';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '10px';

      const acceptButton = document.createElement('button');
      acceptButton.textContent = config.acceptButtonText;
      acceptButton.style.backgroundColor = config.theme === 'dark' ? '#4CAF50' : '#4CAF50'; // Green
      acceptButton.style.color = 'white';
      acceptButton.style.border = 'none';
      acceptButton.style.padding = '10px 16px';
      acceptButton.style.cursor = 'pointer';
      acceptButton.style.borderRadius = '5px';
      acceptButton.style.fontSize = '1rem';
      acceptButton.style.transition = 'background-color 0.3s ease';
      acceptButton.style.whiteSpace = 'nowrap';

      acceptButton.addEventListener('click', () => {
        setCookie(config.cookieName, config.cookieValue, config.expiryDays);
        if (config.transition === 'fade') {
          banner.style.opacity = '0';
        } else if (config.transition === 'slide') {
          banner.style.transform = config.position === 'bottom' ? 'translateY(100%)' : 'translateY(-100%)';
        } else {
          banner.style.display = 'none';
        }
        setTimeout(()=> {
            document.body.removeChild(banner);
        }, 300);

      });

      const declineButton = document.createElement('button');
      declineButton.textContent = config.declineButtonText;
      declineButton.style.backgroundColor = config.theme === 'dark' ? '#f44336' : '#f44336'; // Red
      declineButton.style.color = 'white';
      declineButton.style.border = 'none';
      declineButton.style.padding = '10px 16px';
      declineButton.style.cursor = 'pointer';
      declineButton.style.borderRadius = '5px';
      declineButton.style.fontSize = '1rem';
      declineButton.style.transition = 'background-color 0.3s ease';
      declineButton.style.whiteSpace = 'nowrap';

      declineButton.addEventListener('click', () => {
        if (config.requireConsent) {
          // You might want to handle this differently, e.g., redirect to a limited functionality version
          alert('Cookie use is declined. This site may not function as expected.');
        }
        if (config.transition === 'fade') {
          banner.style.opacity = '0';
        } else if (config.transition === 'slide') {
             banner.style.transform = config.position === 'bottom' ? 'translateY(100%)' : 'translateY(-100%)';
        }
        else{
          banner.style.display = 'none';
        }

        setTimeout(()=> {
            document.body.removeChild(banner);
        }, 300);
      });

      acceptButton.addEventListener('mouseover', () => {
        acceptButton.style.backgroundColor = config.theme === 'dark' ? '#45a049' : '#45a049'; // Darker green
      });
      acceptButton.addEventListener('mouseout', () => {
        acceptButton.style.backgroundColor = config.theme === 'dark' ? '#4CAF50' : '#4CAF50';
      });

      declineButton.addEventListener('mouseover', () => {
        declineButton.style.backgroundColor = config.theme === 'dark' ? '#d32f2f' : '#d32f2f'; // Darker red
      });
      declineButton.addEventListener('mouseout', () => {
        declineButton.style.backgroundColor = config.theme === 'dark' ? '#f44336' : '#f44336';
      });

      buttonContainer.appendChild(acceptButton);
      if (config.requireConsent) {
        buttonContainer.appendChild(declineButton);
      }

      banner.appendChild(messageContainer);
      banner.appendChild(buttonContainer);
      return banner;
    };

    // Check for existing cookie and show banner if not present
    if (config.autoOpen && !getCookie(config.cookieName)) {
      const banner = createCookieBanner();
      document.body.appendChild(banner);

       // Add transition effect after the banner is added to the DOM
        setTimeout(() => {
            if (config.transition === 'fade') {
                banner.style.opacity = '1';
            } else if (config.transition === 'slide') {
                banner.style.transform = 'translateY(0)';
            }
        }, 10);
    }
  })();
