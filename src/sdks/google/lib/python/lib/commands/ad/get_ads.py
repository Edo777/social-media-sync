from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: get_campaigns
class ExecuteCommand(BaseCommand):
    # you can see Ad fields in link in bellow :
    # https://developers.google.com/google-ads/api/reference/rpc/v6/Ad
    
    __fields = [
        # fields from ResponsiveSearchAdInfo
        """
            ad_group_ad.ad.responsive_search_ad.headlines,
            ad_group_ad.ad.responsive_search_ad.descriptions,
            ad_group_ad.ad.responsive_search_ad.path1,
            ad_group_ad.ad.responsive_search_ad.path2,
        """,

        # fields from ResponsiveDisplayAdInfo
        """
            ad_group_ad.ad.responsive_display_ad.marketing_images,
            ad_group_ad.ad.responsive_display_ad.square_marketing_images,
            ad_group_ad.ad.responsive_display_ad.logo_images,
            ad_group_ad.ad.responsive_display_ad.square_logo_images,
            ad_group_ad.ad.responsive_display_ad.headlines,
            ad_group_ad.ad.responsive_display_ad.long_headline,
            ad_group_ad.ad.responsive_display_ad.descriptions,
            ad_group_ad.ad.responsive_display_ad.youtube_videos,
            ad_group_ad.ad.responsive_display_ad.format_setting,
            ad_group_ad.ad.responsive_display_ad.control_spec.enable_asset_enhancements,
            ad_group_ad.ad.responsive_display_ad.control_spec.enable_autogen_video,
            ad_group_ad.ad.responsive_display_ad.business_name,
            ad_group_ad.ad.responsive_display_ad.main_color,
            ad_group_ad.ad.responsive_display_ad.accent_color,
            ad_group_ad.ad.responsive_display_ad.allow_flexible_color,
            ad_group_ad.ad.responsive_display_ad.call_to_action_text,
            ad_group_ad.ad.responsive_display_ad.price_prefix,
            ad_group_ad.ad.responsive_display_ad.promo_text,
        """,

        # fields from AppAdInfo
        """
            ad_group_ad.ad.app_ad.mandatory_ad_text,
            ad_group_ad.ad.app_ad.headlines,
            ad_group_ad.ad.app_ad.descriptions,
            ad_group_ad.ad.app_ad.images,
            ad_group_ad.ad.app_ad.youtube_videos,
        """,

        # fields from ImageAdInfo
        """
            ad_group_ad.ad.image_ad.mime_type,
            ad_group_ad.ad.image_ad.pixel_width,
            ad_group_ad.ad.image_ad.pixel_height,
            ad_group_ad.ad.image_ad.image_url,
            ad_group_ad.ad.image_ad.name,
            ad_group_ad.ad.image_ad.preview_image_url,
        """,
    ]

    __query = """
        SELECT
            ad_group_ad.status,
            ad_group_ad.ad.id,
            ad_group_ad.ad.name,
            ad_group_ad.ad.type,

            %s

            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.average_cpc,
            metrics.average_cpm,
            metrics.cost_micros
        FROM
            ad_group_ad
        WHERE
            ad_group_ad.ad_group = ':ad_group_resource'
        ORDER BY
            ad_group_ad.ad.id
    """

    # map result row
    def __map_result_row(self, row):
        metrics = self.serialize(row.metrics)
        ad = self.serialize(row.ad_group_ad)
        ad["metrics"] = metrics

        return ad

    # convert response to serialized ads list
    def __response_to_ads(self, responses):
        return self.loop_result(
            responses = responses,
            callback = lambda row: self.__map_result_row(row)
        )

    # start execution
    @override_method
    def start_execution(self):
        ad_group_resource = self.get_resource_by_id("adGroups", self.get_argument("adGroupId"))

        final_query = self.__query % "".join(self.__fields)
        responses = self.run_query(final_query, {
            "ad_group_resource": ad_group_resource
        })
        # return responses.results[0]
        ads = self.__response_to_ads(responses)
        return ads
