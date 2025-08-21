import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
import { buildCorsHeaders, handleCors } from '../_shared/cors.ts';
import { Resend } from "npm:resend@2.0.0";

interface InviteRequest {
  email: string;
  role: 'org_admin' | 'org_user';
  organizationName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Get origin from request and build dynamic CORS headers
  const origin = req.headers.get('origin') ?? undefined;
  const corsHeaders = buildCorsHeaders(origin);

  try {
    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase clients - one for user auth, one for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client for user authentication
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { email, role, organizationName }: InviteRequest = await req.json();

    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'Email and role are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's organization membership to verify they can send invitations
    const { data: userOrgs, error: orgError } = await supabase
      .from('user_organizations')
      .select('organization_id, role, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (orgError || !userOrgs) {
      console.error('Failed to get user organization:', orgError);
      return new Response(JSON.stringify({ error: 'User not associated with any organization' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify user has admin privileges to send invitations
    if (userOrgs.role !== 'org_admin' && userOrgs.role !== 'platform_owner') {
      return new Response(JSON.stringify({ error: 'Only organization administrators can send invitations' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get organization details including auth preferences
    const { data: org, error: orgDetailsError } = await supabase
      .from('organizations')
      .select('id, name, domain, settings')
      .eq('id', userOrgs.organization_id)
      .single();

    if (orgDetailsError || !org) {
      console.error('Failed to get organization details:', orgDetailsError);
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the inviting user's auth provider to detect Azure AD usage
    const { data: invitingUser, error: invitingUserError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    let detectedAuthMethod = 'email_password';
    
    if (invitingUser?.user && invitingUser.user.app_metadata?.provider === 'azure') {
      detectedAuthMethod = 'azure_ad';
      console.log('Detected Azure AD usage by inviting user');
    }

    // Extract auth preferences from organization settings
    let settings = org.settings || {};
    let authMethod = settings.auth_method || detectedAuthMethod;
    let azureAdEnabled = settings.azure_ad_enabled || (detectedAuthMethod === 'azure_ad');
    let emailPasswordEnabled = settings.email_password_enabled !== false;

    // Auto-configure organization settings if Azure AD is detected and not already configured
    if (detectedAuthMethod === 'azure_ad' && !settings.azure_ad_enabled) {
      console.log('Auto-configuring organization for Azure AD');
      
      const updatedSettings = {
        ...settings,
        auth_method: 'azure_ad',
        azure_ad_enabled: true,
        email_password_enabled: true, // Keep both enabled for flexibility
        default_auth_method: 'azure_ad'
      };

      // Update organization settings
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', org.id);

      if (updateError) {
        console.warn('Failed to update organization auth settings:', updateError);
      } else {
        console.log('Organization auth settings updated for Azure AD');
        settings = updatedSettings;
        authMethod = 'azure_ad';
        azureAdEnabled = true;
      }
    }

    let data, error;

    // Branch by authentication method - Azure AD vs email/password
    if (authMethod === 'azure_ad') {
      console.log(`Creating Azure AD invitation for ${email}`);
      
      // Store custom invitation in org_invitations table (no user creation)
      const { data: customInvite, error: customInviteError } = await supabaseAdmin
        .from('org_invitations')
        .insert({
          organization_id: org.id,
          email,
          role,
          invited_by: user.id,
          method: 'azure_ad',
          status: 'pending'
        })
        .select()
        .single();

      if (customInviteError) {
        console.error('Error creating custom invitation:', customInviteError);
        return new Response(JSON.stringify({ error: 'Failed to create invitation' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('Custom invitation created:', customInvite.id);

      // Send custom Azure AD invitation email via Resend
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      const siteUrl = Deno.env.get('SITE_URL') || 'https://www.OmniClause.com';
      const inviteLink = `${siteUrl}/auth/complete-invite?token=${customInvite.token}&type=azure_ad`;

      try {
        const emailResponse = await resend.emails.send({
          from: 'OmniClause <noreply@OmniClause.com>',
          to: [email],
          subject: `You're invited to join ${org.name} on OmniClause`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">You're invited to join ${org.name}</h1>
              <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
                You've been invited to join <strong>${org.name}</strong> on OmniClause. 
                Since your organization uses Microsoft Azure AD, please use the button below to sign in with your Microsoft account.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Continue with Microsoft</a>
              </div>
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                If you're having trouble clicking the button, copy and paste the URL below into your web browser:
                <br><a href="${inviteLink}" style="color: #0066cc;">${inviteLink}</a>
              </p>
              <p style="color: #999; font-size: 14px; margin-top: 20px;">
                This invitation will expire in 7 days.
              </p>
            </div>
          `,
        });

        if (emailResponse.error) {
          console.error('Error sending Azure AD invitation email:', emailResponse.error);
          return new Response(JSON.stringify({ error: 'Failed to send invitation email' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Azure AD invitation email sent successfully');
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Azure AD invitation sent to ${email}`,
          type: 'azure_ad'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        return new Response(JSON.stringify({ error: 'Failed to send invitation email' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Email/password flow - use native Supabase invitation
    console.log(`Using email/password invitation flow for ${email}`);
    
    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        organization_id: org.id,
        organization_name: organizationName || org.name,
        organization_domain: org.domain,
        auth_method: authMethod,
        azure_ad_enabled: azureAdEnabled,
        email_password_enabled: emailPasswordEnabled,
        role: role,
        invited_by: user.id
      },
      redirectTo: `${Deno.env.get('SITE_URL') || 'https://www.OmniClause.com'}/auth/complete-invite`
    });

    if (inviteResult.error) {
      console.error('Failed to send invitation:', inviteResult.error);
      return new Response(JSON.stringify({ error: inviteResult.error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Invitation sent successfully to ${email} for organization ${org.name}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Invitation sent successfully',
      type: 'email_password',
      user: inviteResult.data?.user 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in invite-user function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});