import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data, user_id } = body;

    let webhookUrl: string | undefined;
    let title = '';
    let color = 0; // Decimal color code

    if (type === 'intake') {
      webhookUrl = process.env.DISCORD_INTAKE_WEBHOOK_URL;
      title = '📝 New Skin Profile Submitted';
      color = 13146766; // Beige-ish / Gold (#C8A28E converted to decimal is 13148814, trying close)
    } else if (type === 'feedback') {
      webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;
      title = '💬 New Feedback Received';
      color = 3447003; // Blue-ish
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (!webhookUrl) {
      console.error(`Discord webhook URL not configured for type: ${type}`);
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    // Format fields for Discord Embed
    const fields = [];
    
    if (user_id) {
        fields.push({ name: 'User ID', value: user_id, inline: true });
    }

    // Iterate through data object to create fields
    // Limit to 25 fields (Discord limit) and truncation if needed
    let count = 0;
    for (const [key, value] of Object.entries(data)) {
        if (count >= 24) break; 
        if (key === 'user_id' || key === 'updated_at') continue; // Skip redundant fields

        let displayValue = 'N/A';
        if (Array.isArray(value)) {
            displayValue = value.length > 0 ? value.join(', ') : 'None';
        } else if (typeof value === 'object' && value !== null) {
            displayValue = JSON.stringify(value);
        } else if (value !== undefined && value !== null && value !== '') {
            displayValue = String(value);
        } else {
            continue; // Skip empty fields
        }

        // Truncate if too long (Discord limit is 1024 chars per field value)
        if (displayValue.length > 1000) {
            displayValue = displayValue.substring(0, 1000) + '...';
        }

        // Capitalize key
        const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        fields.push({
            name: fieldName,
            value: displayValue,
            inline: false
        });
        count++;
    }

    const payload = {
      embeds: [
        {
          title: title,
          color: color,
          timestamp: new Date().toISOString(),
          fields: fields,
          footer: {
            text: 'Lila AI Notification System'
          }
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text();
        console.error('Discord API error:', text);
        return NextResponse.json({ error: 'Failed to send to Discord' }, { status: response.status });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in discord webhook route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
