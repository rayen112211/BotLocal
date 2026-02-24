import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
    apiVersion: '2026-01-28.clover',
});

// Allow adding properties to global object safely
declare global {
    var STRIPE_PRICES: Record<string, string>;
    var PLAN_FEATURES: Record<string, any>;
}

export async function initializeStripePrices() {
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.warn('⚠️ STRIPE_SECRET_KEY not set. Skipping Stripe product initialization.');
            global.STRIPE_PRICES = { starter: 'free', pro: 'dummy_pro', enterprise: 'dummy_enterprise' };
            global.PLAN_FEATURES = getPlanFeatures();
            return;
        }

        let product = await stripe.products.list({ limit: 1 });
        let productId = product.data[0]?.id;

        if (!productId) {
            const newProduct = await stripe.products.create({
                name: 'BotLocal Plans',
                description: 'AI WhatsApp & Telegram Bot Plans'
            });
            productId = newProduct.id;
        }

        const PLANS = getPlanFeatures();

        const STRIPE_PRICES: Record<string, string> = {};

        for (const [planKey, planData] of Object.entries(PLANS)) {
            let priceId;

            if (planData.price === 0) {
                priceId = 'free';
            } else {
                // To avoid creating duplicates on every restart, search for existing active prices
                const existingPrices = await stripe.prices.list({
                    product: productId,
                    active: true,
                    limit: 10
                });

                const existingPrice = existingPrices.data.find(
                    p => p.metadata?.plan === planKey && p.unit_amount === planData.price && p.recurring?.interval === 'month'
                );

                if (existingPrice) {
                    priceId = existingPrice.id;
                } else {
                    const price = await stripe.prices.create({
                        product: productId,
                        unit_amount: planData.price,
                        currency: 'usd',
                        recurring: {
                            interval: 'month',
                            interval_count: 1
                        },
                        metadata: {
                            plan: planKey,
                            plan_name: planData.name
                        }
                    });
                    priceId = price.id;
                }
            }

            STRIPE_PRICES[planKey] = priceId;
        }

        global.STRIPE_PRICES = STRIPE_PRICES;
        global.PLAN_FEATURES = PLANS;

        console.log('✅ Stripe prices auto-initialized:', STRIPE_PRICES);
    } catch (error) {
        console.error('❌ Error initializing Stripe prices:', error);
    }
}

function getPlanFeatures() {
    return {
        starter: {
            name: 'Starter',
            price: 0, // FREE
            features: {
                messages_per_month: 100,
                businesses: 1,
                ai_model: 'basic',
                support: 'community',
                knowledge_base: false
            }
        },
        pro: {
            name: 'Pro',
            price: 2999, // $29.99/month
            features: {
                messages_per_month: 5000,
                businesses: 10,
                ai_model: 'advanced',
                support: 'email',
                knowledge_base: true,
                custom_personality: true
            }
        },
        enterprise: {
            name: 'Enterprise',
            price: 9999, // $99.99/month
            features: {
                messages_per_month: null, // UNLIMITED
                businesses: null, // UNLIMITED
                ai_model: 'advanced_plus',
                support: '24/7_phone',
                knowledge_base: true,
                custom_personality: true,
                api_access: true,
                dedicated_account_manager: true
            }
        }
    };
}
