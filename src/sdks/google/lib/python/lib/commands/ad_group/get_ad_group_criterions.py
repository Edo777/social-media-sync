from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: get_ad_group_criterions
class ExecuteCommand(BaseCommand):
    __query = """
        SELECT
            ad_group_criterion.ad_group,
            ad_group_criterion.criterion_id,
            ad_group_criterion.type,
            ad_group_criterion.status,
            ad_group_criterion.negative,
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            ad_group_criterion.age_range.type,
            ad_group_criterion.gender.type
        FROM
            ad_group_criterion
        WHERE
            ad_group_criterion.ad_group = ':ad_group_resource'
    """

    # start execution
    @override_method
    def start_execution(self):
        ad_group_id = self.get_argument("adGroupId")
        ad_group_resource = self.get_resource_by_id("adGroups", ad_group_id)

        responses = self.run_query(self.__query, {
            "ad_group_resource": ad_group_resource
        })

        results = self.loop_result(
            responses = responses,
            callback = lambda row: self.serialize(row.ad_group_criterion)
        )

        return results
