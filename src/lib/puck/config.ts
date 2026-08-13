import type { Config } from '@measured/puck'
import { BobgoShippingOptions } from '@/components/Checkout/BobgoShippingOptions'
import { BobgoPickupSelector }  from '@/components/Checkout/BobgoPickupSelector'
import { BobgoShippingSummary } from '@/components/Checkout/BobgoShippingSummary'
import { ShippingOptions } from '@/components/Checkout/ShippingOptions'
import { PickupSelector }  from '@/components/Checkout/PickupSelector'
import { ShippingSummary } from '@/components/Checkout/ShippingSummary'
import { DeliveryAddressForm } from '@/components/Checkout/DeliveryAddressForm'
import { Container }     from '@/components/Layout/Container'
import { Columns }       from '@/components/Layout/Columns'
import { TextBlock }     from '@/components/Content/TextBlock'
import { ImageBlock }    from '@/components/Content/ImageBlock'
import { Spacer }        from '@/components/Content/Spacer'
import { Divider }       from '@/components/Content/Divider'
import { HeroBanner }       from '@/components/Commerce/HeroBanner'
import { HeroSlider }       from '@/components/Commerce/HeroSlider'
import { PromoBannerGrid }  from '@/components/Commerce/PromoBannerGrid'
import { LogoStrip }        from '@/components/Commerce/LogoStrip'
import { ProductGrid }      from '@/components/Commerce/ProductGrid'
import { ProductCard }      from '@/components/Commerce/ProductCard'
import { CollectionList }   from '@/components/Commerce/CollectionList'
import { ProductShowcase }  from '@/components/Commerce/ProductShowcase'
import { ProductCarousel }  from '@/components/Commerce/ProductCarousel'
import { CartWidget }       from '@/components/Commerce/CartWidget'
import { ProductFilter }    from '@/components/Commerce/ProductFilter'
import { AnimatedTimeline }  from '@/components/Advanced/AnimatedTimeline'
import { InteractiveGlobe } from '@/components/Advanced/InteractiveGlobe'
import { AITool }           from '@/components/Advanced/AITool'
import { MultiStepForm }    from '@/components/Advanced/MultiStepForm'
import { ContactForm }       from '@/components/Functional/ContactForm'
import { NewsletterSignup } from '@/components/Functional/NewsletterSignup'
import { SocialFeed }       from '@/components/Functional/SocialFeed'
import { BlogPostList }     from '@/components/Functional/BlogPostList'
import { GoogleMap }        from '@/components/Functional/GoogleMap'
import { ProgressBars }     from '@/components/Functional/ProgressBars'
import { PriceCalculator }  from '@/components/Functional/PriceCalculator'
import { ImageGallery }       from '@/components/Media/ImageGallery'
import { VideoBackground }    from '@/components/Media/VideoBackground'
import { BeforeAfterSlider }  from '@/components/Media/BeforeAfterSlider'
import { ParticleBackground } from '@/components/Media/ParticleBackground'
import { CountdownTimer }     from '@/components/Media/CountdownTimer'
import { HeroSection }   from '@/components/Marketing/HeroSection'
import { FeatureGrid }   from '@/components/Marketing/FeatureGrid'
import { Testimonials }  from '@/components/Marketing/Testimonials'
import { PricingTable }  from '@/components/Marketing/PricingTable'
import { TeamSection }   from '@/components/Marketing/TeamSection'
import { FAQAccordion }  from '@/components/Marketing/FAQAccordion'
import { CallToAction }  from '@/components/Marketing/CallToAction'

export const puckConfig: Config = {
  components: {
    Container,
    Columns,
    TextBlock,
    ImageBlock,
    Spacer,
    Divider,
    HeroBanner,
    HeroSlider,
    PromoBannerGrid,
    LogoStrip,
    ProductGrid,
    ProductCard,
    CollectionList,
    ProductShowcase,
    ProductCarousel,
    CartWidget,
    ProductFilter,
    AnimatedTimeline,
    InteractiveGlobe,
    AITool,
    MultiStepForm,
    ContactForm,
    NewsletterSignup,
    SocialFeed,
    BlogPostList,
    GoogleMap,
    ProgressBars,
    PriceCalculator,
    ImageGallery,
    VideoBackground,
    BeforeAfterSlider,
    ParticleBackground,
    CountdownTimer,
    HeroSection,
    FeatureGrid,
    Testimonials,
    PricingTable,
    TeamSection,
    FAQAccordion,
    CallToAction,
    BobgoShippingOptions,
    BobgoPickupSelector,
    BobgoShippingSummary,
    ShippingOptions,
    PickupSelector,
    ShippingSummary,
    DeliveryAddressForm,
  },

  categories: {
    // Site Header/Footer used to live here as draggable page components. They're
    // now fixed chrome rendered outside Puck entirely (see App.tsx), sourced from
    // sb_site_settings — no longer addable/removable/reorderable per page. Edited
    // from the Site Settings panel (Store Builder → Domain) instead.
    layout: {
      title: 'Layout',
      components: ['Container', 'Columns'],
    },
    content: {
      title: 'Content',
      components: ['TextBlock', 'ImageBlock', 'Spacer', 'Divider'],
    },
    commerce: {
      title: 'E-commerce',
      components: ['HeroSlider', 'HeroBanner', 'PromoBannerGrid', 'LogoStrip', 'ProductGrid', 'ProductCard', 'CollectionList', 'ProductShowcase', 'ProductCarousel', 'CartWidget', 'ProductFilter'],
    },
    marketing: {
      title: 'Marketing',
      components: ['HeroSection', 'FeatureGrid', 'Testimonials', 'PricingTable', 'TeamSection', 'FAQAccordion', 'CallToAction'],
    },
    advanced: {
      title: 'Advanced / Interactive',
      components: ['AnimatedTimeline', 'InteractiveGlobe', 'AITool', 'MultiStepForm'],
    },
    functional: {
      title: 'Functional',
      components: ['ContactForm', 'NewsletterSignup', 'SocialFeed', 'BlogPostList', 'GoogleMap', 'ProgressBars', 'PriceCalculator'],
    },
    media: {
      title: 'Media & Interactivity',
      components: ['ImageGallery', 'VideoBackground', 'BeforeAfterSlider', 'ParticleBackground', 'CountdownTimer'],
    },
    checkout: {
      title: 'Checkout',
      components: ['BobgoShippingOptions', 'BobgoPickupSelector', 'BobgoShippingSummary', 'DeliveryAddressForm', 'ShippingOptions', 'PickupSelector', 'ShippingSummary'],
    },
  },
}
