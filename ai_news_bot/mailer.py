import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        self.email_address = os.getenv("EMAIL_ADDRESS")
        self.email_password = os.getenv("EMAIL_PASSWORD")
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))

    def send_digest(self, news_items, recipients=None):
        if not news_items:
            print("No news to send.")
            return

        if not self.email_address or not self.email_password:
            print("Email credentials not set. Skipping email send (check logged output).")
            return

        if recipients is None:
            # Default to self if no recipients provided (legacy behavior) or empty list
            recipients = [self.email_address]
        
        if not recipients:
             print("No recipients to send to.")
             return

        print(f"Sending digest to {len(recipients)} recipients...")

        subject = f"Daily AI News Digest - {len(news_items)} Updates"
        
        # Build HTML body
        html_content = """
        <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333; border-bottom: 2px solid #5a67d8; padding-bottom: 10px;">AI News Updates</h2>
                <ul style="padding-left: 0; list-style: none;">
        """
        
        for item in news_items:
            html_content += f"""
            <li style="margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                <strong style="font-size: 1.1em;"><a href="{item['link']}" style="color: #5a67d8; text-decoration: none;">{item['title']}</a></strong><br/>
                <span style="color: #888; font-size: 0.85em; display: block; margin-top: 5px;">{item['source']} &bull; {item['published']}</span>
                <p style="color: #555; line-height: 1.6; margin-top: 10px;">{item['summary'][:300]}...</p>
            </li>
            """
            
        html_content += """
                </ul>
                <p style="font-size: 0.8em; color: #aaa; text-align: center; margin-top: 30px;">Automated by AI News Bot</p>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.email_address
        # We will send individually to avoid exposing all emails in TO/CC
        # Alternatively, use BCC. For simplicity/anti-spam, individual sends or BCC is better.
        # Here using BCC approach for efficiency, or loop for personalization. 
        # Let's do a loop for now to ensure delivery, though slower for massive lists.
        # Actually, standard best practice for personal bots:
        
        # MOCK MODE CHECK
        if os.getenv("MOCK_EMAIL_MODE") == "true":
            print("----------------------------------------------------------------")
            print(" [MOCK EMAIL MODE] Email would be sent to:")
            for r in recipients:
                print(f" - {r}")
            print(f" Subject: {subject}")
            print(" Content written to 'last_email.html'")
            with open("last_email.html", "w", encoding="utf-8") as f:
                f.write(html_content)
            print("----------------------------------------------------------------")
            return

        try:
             with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_address, self.email_password)
                
                for recipient in recipients:
                    msg_clone = MIMEMultipart("alternative")
                    msg_clone["Subject"] = subject
                    msg_clone["From"] = self.email_address
                    msg_clone["To"] = recipient
                    msg_clone.attach(MIMEText(html_content, "html"))
                    
                    try:
                        server.sendmail(self.email_address, recipient, msg_clone.as_string())
                        print(f"Sent to {recipient}")
                    except Exception as e:
                        print(f"Failed to send to {recipient}: {e}")
                        
        except Exception as e:
            print(f"SMTP Error: {e}")

if __name__ == "__main__":
    # Test run (requires .env)
    sample_news = [{
        'title': 'Test AI News Item',
        'link': 'http://example.com',
        'summary': 'This is a test summary of the news item.',
        'source': 'Test Source',
        'published': 'Just now'
    }]
    emailer = EmailService()
    emailer.send_digest(sample_news)
